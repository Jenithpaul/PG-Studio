import { Schema, Table, Column, Relation } from '@pg-studio/shared';
import { getDatabaseSchema } from '@pg-studio/introspection';
import { parseSql } from '@pg-studio/schema-parser';
import { createFileScanner, ProjectScanResult } from '@pg-studio/file-scanner';
import { promises as fs } from 'fs';
import {
  SchemaBuilder,
  SchemaSource,
  EnhancedSchema,
  SchemaConflict,
  SchemaMetadata,
  SchemaStatistics,
  SourceMetadata,
  MergeOptions
} from './types';

export class SchemaBuilderImpl implements SchemaBuilder {
  private fileScanner = createFileScanner();

  async buildFromSources(sources: SchemaSource[]): Promise<EnhancedSchema> {
    if (sources.length === 0) {
      throw new Error('At least one schema source is required');
    }

    // Sort sources by priority (highest first)
    const prioritizedSources = this.prioritizeSources(sources);
    
    // Detect conflicts between sources
    const conflicts = this.detectConflicts(prioritizedSources);
    
    // Merge schemas with conflict resolution
    const mergedSchema = this.mergeSourcesWithConflictResolution(prioritizedSources, conflicts);
    
    // Generate metadata and statistics
    const metadata = this.generateMetadata(prioritizedSources);
    const statistics = this.generateStatistics(mergedSchema);

    return {
      ...mergedSchema,
      metadata,
      sources: prioritizedSources,
      conflicts,
      statistics
    };
  }

  mergeSources(schemas: Schema[]): Schema {
    if (schemas.length === 0) {
      return { tables: [], relations: [] };
    }

    if (schemas.length === 1) {
      return schemas[0];
    }

    const mergedTables = new Map<string, Table>();
    const mergedRelations = new Map<string, Relation>();

    // Merge tables - later schemas override earlier ones
    for (const schema of schemas) {
      for (const table of schema.tables) {
        mergedTables.set(table.name, table);
      }
    }

    // Merge relations - later schemas override earlier ones
    for (const schema of schemas) {
      for (const relation of schema.relations) {
        const key = `${relation.sourceTable}-${relation.sourceColumn}-${relation.targetTable}-${relation.targetColumn}`;
        mergedRelations.set(key, relation);
      }
    }

    return {
      tables: Array.from(mergedTables.values()),
      relations: Array.from(mergedRelations.values())
    };
  }

  prioritizeSources(sources: SchemaSource[]): SchemaSource[] {
    return [...sources].sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // If same priority, prefer database over files
      if (a.type === 'database' && b.type !== 'database') {
        return -1;
      }
      if (b.type === 'database' && a.type !== 'database') {
        return 1;
      }
      
      // If same type, prefer newer
      return b.metadata.lastUpdated.getTime() - a.metadata.lastUpdated.getTime();
    });
  }

  resolveConflicts(conflicts: SchemaConflict[]): Schema {
    // This is a simplified implementation - in practice, this would be more sophisticated
    const resolvedTables = new Map<string, Table>();
    const resolvedRelations = new Map<string, Relation>();

    for (const conflict of conflicts) {
      const resolvedSource = this.selectSourceForConflict(conflict);
      
      if (conflict.type === 'table_definition') {
        const table = resolvedSource.schema.tables.find(t => t.name === conflict.tableName);
        if (table) {
          resolvedTables.set(table.name, table);
        }
      }
    }

    return {
      tables: Array.from(resolvedTables.values()),
      relations: Array.from(resolvedRelations.values())
    };
  }

  async buildFromDatabase(connectionString: string): Promise<SchemaSource> {
    const schema = await getDatabaseSchema(connectionString);
    
    return {
      type: 'database',
      priority: 100, // Highest priority for database sources
      schema,
      metadata: {
        connectionString,
        lastUpdated: new Date(),
        tableCount: schema.tables.length,
        relationCount: schema.relations.length
      }
    };
  }

  async buildFromProject(projectPath: string): Promise<SchemaSource> {
    const scanResult = await this.fileScanner.scanProject(projectPath);
    
    // Read and parse all SQL files
    let combinedSql = '';
    const filePaths: string[] = [];
    
    for (const sqlFile of scanResult.sqlFiles) {
      try {
        const content = await fs.readFile(sqlFile.path, 'utf-8');
        combinedSql += `-- File: ${sqlFile.name}\n${content}\n\n`;
        filePaths.push(sqlFile.path);
      } catch (error) {
        console.warn(`Failed to read file ${sqlFile.path}:`, error);
      }
    }
    
    const schema = combinedSql.trim() ? await parseSql(combinedSql) : { tables: [], relations: [] };
    
    return {
      type: 'sql_files',
      priority: 50, // Medium priority for project files
      schema,
      metadata: {
        filePaths,
        projectPath,
        lastUpdated: new Date(),
        tableCount: schema.tables.length,
        relationCount: schema.relations.length,
        scanResult
      }
    };
  }

  async buildFromSqlFiles(filePaths: string[]): Promise<SchemaSource> {
    let combinedSql = '';
    
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        combinedSql += `-- File: ${filePath}\n${content}\n\n`;
      } catch (error) {
        console.warn(`Failed to read file ${filePath}:`, error);
      }
    }
    
    const schema = combinedSql.trim() ? await parseSql(combinedSql) : { tables: [], relations: [] };
    
    return {
      type: 'sql_files',
      priority: 30, // Lower priority for individual files
      schema,
      metadata: {
        filePaths,
        lastUpdated: new Date(),
        tableCount: schema.tables.length,
        relationCount: schema.relations.length
      }
    };
  }

  private detectConflicts(sources: SchemaSource[]): SchemaConflict[] {
    const conflicts: SchemaConflict[] = [];
    const tableMap = new Map<string, SchemaSource[]>();
    
    // Group sources by table name
    for (const source of sources) {
      for (const table of source.schema.tables) {
        if (!tableMap.has(table.name)) {
          tableMap.set(table.name, []);
        }
        tableMap.get(table.name)!.push(source);
      }
    }
    
    // Detect table definition conflicts
    for (const [tableName, tableSources] of tableMap) {
      if (tableSources.length > 1) {
        const conflict = this.detectTableConflicts(tableName, tableSources);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  private detectTableConflicts(tableName: string, sources: SchemaSource[]): SchemaConflict | null {
    const tables = sources.map(source => 
      source.schema.tables.find(t => t.name === tableName)!
    );
    
    // Check for column differences
    const columnSets = tables.map(table => 
      new Set(table.columns.map(col => `${col.name}:${col.type}`))
    );
    
    const hasColumnConflicts = !columnSets.every(set => 
      set.size === columnSets[0].size && 
      [...set].every(col => columnSets[0].has(col))
    );
    
    if (hasColumnConflicts) {
      return {
        type: 'table_definition',
        tableName,
        sources,
        resolution: 'prefer_database'
      };
    }
    
    return null;
  }

  private mergeSourcesWithConflictResolution(
    sources: SchemaSource[], 
    conflicts: SchemaConflict[]
  ): Schema {
    const schemas = sources.map(source => source.schema);
    const baseSchema = this.mergeSources(schemas);
    
    // Apply conflict resolutions
    for (const conflict of conflicts) {
      const resolvedSource = this.selectSourceForConflict(conflict);
      
      if (conflict.type === 'table_definition') {
        const resolvedTable = resolvedSource.schema.tables.find(t => t.name === conflict.tableName);
        if (resolvedTable) {
          const tableIndex = baseSchema.tables.findIndex(t => t.name === conflict.tableName);
          if (tableIndex >= 0) {
            baseSchema.tables[tableIndex] = resolvedTable;
          }
        }
      }
    }
    
    return baseSchema;
  }

  private selectSourceForConflict(conflict: SchemaConflict): SchemaSource {
    switch (conflict.resolution) {
      case 'prefer_database':
        return conflict.sources.find(s => s.type === 'database') || conflict.sources[0];
      case 'prefer_newest':
        return conflict.sources.reduce((newest, current) => 
          current.metadata.lastUpdated > newest.metadata.lastUpdated ? current : newest
        );
      case 'prefer_highest_priority':
      default:
        return conflict.sources[0]; // Already sorted by priority
    }
  }

  private generateMetadata(sources: SchemaSource[]): SchemaMetadata {
    const hasDatabase = sources.some(s => s.type === 'database');
    const hasFiles = sources.some(s => s.type === 'sql_files' || s.type === 'migration_files');
    
    let sourceType: 'database' | 'files' | 'mixed';
    if (hasDatabase && hasFiles) {
      sourceType = 'mixed';
    } else if (hasDatabase) {
      sourceType = 'database';
    } else {
      sourceType = 'files';
    }
    
    const databaseSource = sources.find(s => s.type === 'database');
    const projectSource = sources.find(s => s.metadata.projectPath);
    
    return {
      name: projectSource?.metadata.projectPath ? 
        `Schema for ${projectSource.metadata.projectPath}` : 
        'Merged Schema',
      version: '1.0.0',
      lastUpdated: new Date(),
      source: sourceType,
      projectPath: projectSource?.metadata.projectPath,
      connectionString: databaseSource?.metadata.connectionString
    };
  }

  private generateStatistics(schema: Schema): SchemaStatistics {
    const columnCount = schema.tables.reduce((sum, table) => sum + table.columns.length, 0);
    
    let largestTable: { name: string; columnCount: number } | null = null;
    let mostConnectedTable: { name: string; connectionCount: number } | null = null;
    
    // Find largest table by column count
    for (const table of schema.tables) {
      if (!largestTable || table.columns.length > largestTable.columnCount) {
        largestTable = { name: table.name, columnCount: table.columns.length };
      }
    }
    
    // Find most connected table by relationship count
    const connectionCounts = new Map<string, number>();
    for (const relation of schema.relations) {
      connectionCounts.set(relation.sourceTable, (connectionCounts.get(relation.sourceTable) || 0) + 1);
      connectionCounts.set(relation.targetTable, (connectionCounts.get(relation.targetTable) || 0) + 1);
    }
    
    for (const [tableName, connectionCount] of connectionCounts) {
      if (!mostConnectedTable || connectionCount > mostConnectedTable.connectionCount) {
        mostConnectedTable = { name: tableName, connectionCount };
      }
    }
    
    return {
      tableCount: schema.tables.length,
      columnCount,
      relationCount: schema.relations.length,
      indexCount: 0, // Not tracked in current schema format
      constraintCount: schema.relations.length, // Approximate
      largestTable,
      mostConnectedTable
    };
  }
}