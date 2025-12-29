import { Schema } from '@pg-studio/shared';
import type { ProjectScanResult } from '@pg-studio/file-scanner';

export interface SchemaSource {
  type: 'database' | 'sql_files' | 'migration_files';
  priority: number;
  schema: Schema;
  metadata: SourceMetadata;
}

export interface SourceMetadata {
  connectionString?: string;
  filePaths?: string[];
  projectPath?: string;
  lastUpdated: Date;
  tableCount: number;
  relationCount: number;
  scanResult?: ProjectScanResult;
}

export interface SchemaConflict {
  type: 'table_definition' | 'column_type' | 'constraint_mismatch' | 'relation_mismatch';
  tableName: string;
  columnName?: string;
  constraintName?: string;
  sources: SchemaSource[];
  resolution: 'prefer_database' | 'prefer_newest' | 'prefer_highest_priority' | 'manual';
  resolvedValue?: any;
}

export interface EnhancedSchema extends Schema {
  metadata: SchemaMetadata;
  sources: SchemaSource[];
  conflicts: SchemaConflict[];
  statistics: SchemaStatistics;
}

export interface SchemaMetadata {
  name: string;
  version: string;
  lastUpdated: Date;
  source: 'database' | 'files' | 'mixed';
  projectPath?: string;
  connectionString?: string;
}

export interface SchemaStatistics {
  tableCount: number;
  columnCount: number;
  relationCount: number;
  indexCount: number;
  constraintCount: number;
  largestTable: { name: string; columnCount: number } | null;
  mostConnectedTable: { name: string; connectionCount: number } | null;
}

export interface SchemaBuilder {
  buildFromSources(sources: SchemaSource[]): Promise<EnhancedSchema>;
  mergeSources(schemas: Schema[]): Schema;
  prioritizeSources(sources: SchemaSource[]): SchemaSource[];
  resolveConflicts(conflicts: SchemaConflict[]): Schema;
  buildFromDatabase(connectionString: string): Promise<SchemaSource>;
  buildFromProject(projectPath: string): Promise<SchemaSource>;
  buildFromSqlFiles(filePaths: string[]): Promise<SchemaSource>;
}

export interface MergeOptions {
  conflictResolution: 'prefer_database' | 'prefer_newest' | 'prefer_highest_priority';
  includeMetadata: boolean;
  trackConflicts: boolean;
}