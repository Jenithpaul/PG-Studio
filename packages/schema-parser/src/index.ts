import { parse } from 'pgsql-parser';
import { Schema, Table, Column, Relation } from '@pg-studio/shared';

/**
 * SQL parsing error with enhanced metadata
 */
export interface SqlParsingError extends Error {
  code: string;
  filePath?: string;
  lineNumber?: number;
  recoverable: boolean;
  partialResult?: Schema;
  suggestedActions: string[];
}

/**
 * SQL parsing result with warnings
 */
export interface SqlParsingResult {
  schema: Schema;
  warnings: SqlParsingWarning[];
  errors: SqlParsingError[];
  success: boolean;
}

/**
 * SQL parsing warning
 */
export interface SqlParsingWarning {
  message: string;
  filePath?: string;
  lineNumber?: number;
  statementType?: string;
}

interface ForeignKeyConstraint {
  constraintName?: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
}

/**
 * Create a SQL parsing error with helpful metadata
 */
function createSqlParsingError(
  error: Error,
  filePath?: string,
  partialResult?: Schema
): SqlParsingError {
  const sqlError = error as SqlParsingError;
  sqlError.code = 'SQL_PARSE_ERROR';
  sqlError.filePath = filePath;
  sqlError.recoverable = true;
  sqlError.partialResult = partialResult;
  sqlError.suggestedActions = [
    'Check the SQL syntax in the file',
    'Verify the SQL is valid PostgreSQL syntax',
    'Look for missing semicolons or brackets'
  ];
  
  // Try to extract line number from error message
  const lineMatch = error.message.match(/line (\d+)/i);
  if (lineMatch) {
    sqlError.lineNumber = parseInt(lineMatch[1], 10);
  }
  
  return sqlError;
}

/**
 * Parse SQL with enhanced error handling and partial results
 */
export async function parseSqlWithDetails(
  sql: string,
  filePath?: string
): Promise<SqlParsingResult> {
  const warnings: SqlParsingWarning[] = [];
  const errors: SqlParsingError[] = [];
  
  // Handle empty input
  if (!sql || sql.trim().length === 0) {
    return {
      schema: { tables: [], relations: [] },
      warnings: [{
        message: 'Empty SQL input',
        filePath
      }],
      errors: [],
      success: true
    };
  }
  
  try {
    const schema = await parseSql(sql);
    return {
      schema,
      warnings,
      errors,
      success: true
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const sqlError = createSqlParsingError(err, filePath);
    
    // Try to parse individual statements for partial results
    const partialSchema = await tryPartialParse(sql, warnings);
    sqlError.partialResult = partialSchema;
    
    return {
      schema: partialSchema,
      warnings,
      errors: [sqlError],
      success: partialSchema.tables.length > 0
    };
  }
}

/**
 * Try to parse SQL by splitting into individual statements
 */
async function tryPartialParse(
  sql: string,
  warnings: SqlParsingWarning[]
): Promise<Schema> {
  const tables: Table[] = [];
  const relations: Relation[] = [];
  
  // Split by semicolons and try to parse each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';';
    try {
      const result = await parseSql(statement);
      tables.push(...result.tables);
      relations.push(...result.relations);
    } catch {
      warnings.push({
        message: `Failed to parse statement ${i + 1}`,
        statementType: detectStatementType(statement)
      });
    }
  }
  
  return { tables, relations };
}

/**
 * Detect the type of SQL statement
 */
function detectStatementType(sql: string): string {
  const upperSql = sql.trim().toUpperCase();
  if (upperSql.startsWith('CREATE TABLE')) return 'CREATE TABLE';
  if (upperSql.startsWith('ALTER TABLE')) return 'ALTER TABLE';
  if (upperSql.startsWith('CREATE INDEX')) return 'CREATE INDEX';
  if (upperSql.startsWith('CREATE VIEW')) return 'CREATE VIEW';
  if (upperSql.startsWith('CREATE FUNCTION')) return 'CREATE FUNCTION';
  if (upperSql.startsWith('INSERT')) return 'INSERT';
  if (upperSql.startsWith('UPDATE')) return 'UPDATE';
  if (upperSql.startsWith('DELETE')) return 'DELETE';
  return 'UNKNOWN';
}

export async function parseSql(sql: string): Promise<Schema> {
  try {
    const ast = await parse(sql);
    const tables: Table[] = [];
    const relations: Relation[] = [];
    const foreignKeyConstraints: Map<string, ForeignKeyConstraint[]> = new Map();

    // Handle the stmts array from pgsql-parser
    const statements = ast.stmts || [];

    for (const stmtWrapper of statements) {
      const statement = stmtWrapper.stmt;
      
      if ('CreateStmt' in statement) {
        const createStmt = statement.CreateStmt;
        const tableName = createStmt.relation.relname;
        const columns: Column[] = [];
        let primaryKeys: string[] = [];
        const tableForeignKeys: ForeignKeyConstraint[] = [];

        for (const elt of createStmt.tableElts) {
          if (elt.ColumnDef) {
            const colDef = elt.ColumnDef;
            const colName = colDef.colname;
            const typeName = (colDef.typeName.names.slice(-1)[0] as any).String.str;

            let isPrimaryKey = false;
            let isForeignKey = false;

            if (colDef.constraints) {
              for (const constraint of colDef.constraints) {
                if (constraint.Constraint.contype === 'CONSTR_PRIMARY') {
                  isPrimaryKey = true;
                  primaryKeys.push(colName);
                } else if (constraint.Constraint.contype === 'CONSTR_FOREIGN') {
                  isForeignKey = true;
                  // Handle inline REFERENCES clause
                  const fkConstraint = extractForeignKeyFromConstraint(constraint.Constraint, [colName]);
                  if (fkConstraint) {
                    tableForeignKeys.push(fkConstraint);
                  }
                }
              }
            }

            columns.push({
              id: `${tableName}-${colName}`,
              name: colName,
              type: typeName,
              isPrimaryKey: isPrimaryKey,
              isForeignKey: isForeignKey,
              isNullable: true, // Default, can be refined
            });
          } else if (elt.Constraint) {
            const constraint = elt.Constraint;
            if (constraint.contype === 'CONSTR_PRIMARY') {
              // Primary key defined at the table level
              primaryKeys.push(...constraint.keys.map((k: any) => k.String.str));
            } else if (constraint.contype === 'CONSTR_FOREIGN') {
              // Foreign key defined at the table level
              const sourceColumns = constraint.keys.map((k: any) => k.String.str);
              const fkConstraint = extractForeignKeyFromConstraint(constraint, sourceColumns);
              if (fkConstraint) {
                tableForeignKeys.push(fkConstraint);
                // Mark columns as foreign keys
                for (const colName of sourceColumns) {
                  const column = columns.find(c => c.name === colName);
                  if (column) {
                    column.isForeignKey = true;
                  }
                }
              }
            }
          }
        }
        
        // Update isPrimaryKey for columns defined in a table-level constraint
        if(primaryKeys.length > 0) {
            for(const col of columns) {
                if(primaryKeys.includes(col.name)) {
                    col.isPrimaryKey = true;
                }
            }
        }

        tables.push({
          id: tableName,
          name: tableName,
          columns: columns,
        });

        if (tableForeignKeys.length > 0) {
          foreignKeyConstraints.set(tableName, tableForeignKeys);
        }
      } else if ('AlterTableStmt' in statement) {
        // Handle ALTER TABLE statements
        const alterTableStmt = statement.AlterTableStmt;
        const tableName = alterTableStmt.relation.relname;
        
        for (const cmd of alterTableStmt.cmds) {
          if (cmd.AlterTableCmd && cmd.AlterTableCmd.subtype === 'AT_AddConstraint') {
            const constraint = cmd.AlterTableCmd.def.Constraint;
            if (constraint && constraint.contype === 'CONSTR_FOREIGN') {
              // For ALTER TABLE, use fk_attrs instead of keys
              const sourceColumns = constraint.fk_attrs ? constraint.fk_attrs.map((k: any) => k.String.str) : [];
              const fkConstraint = extractForeignKeyFromConstraint(constraint, sourceColumns);
              if (fkConstraint) {
                const existingConstraints = foreignKeyConstraints.get(tableName) || [];
                existingConstraints.push(fkConstraint);
                foreignKeyConstraints.set(tableName, existingConstraints);
              }
            }
          }
        }
      }
    }

    // Convert foreign key constraints to relations
    for (const [sourceTable, constraints] of foreignKeyConstraints) {
      for (const constraint of constraints) {
        for (let i = 0; i < constraint.sourceColumns.length; i++) {
          const sourceColumn = constraint.sourceColumns[i];
          const targetColumn = constraint.targetColumns[i] || constraint.targetColumns[0]; // Handle single target column case
          
          relations.push({
            id: `${sourceTable}-${sourceColumn}-${constraint.targetTable}-${targetColumn}`,
            sourceTable,
            targetTable: constraint.targetTable,
            sourceColumn,
            targetColumn,
            constraintName: constraint.constraintName,
            onDelete: constraint.onDelete,
            onUpdate: constraint.onUpdate,
          });
        }
      }
    }

    return { tables, relations };
  } catch (e) {
    console.error('Failed to parse SQL:', e);
    return { tables: [], relations: [] };
  }
}

export function prettyPrintSchema(schema: Schema): string {
  const sqlStatements: string[] = [];

  // Generate CREATE TABLE statements
  for (const table of schema.tables) {
    const columnDefinitions: string[] = [];
    const constraints: string[] = [];

    // Add column definitions
    for (const column of table.columns) {
      let columnDef = `  ${column.name} ${column.type.toUpperCase()}`;
      
      if (!column.isNullable) {
        columnDef += ' NOT NULL';
      }

      columnDefinitions.push(columnDef);
    }

    // Add primary key constraint
    const primaryKeyColumns = table.columns
      .filter(col => col.isPrimaryKey)
      .map(col => col.name);
    
    if (primaryKeyColumns.length > 0) {
      if (primaryKeyColumns.length === 1) {
        // Single column primary key - can be inline or separate constraint
        const pkIndex = columnDefinitions.findIndex(def => def.includes(primaryKeyColumns[0]));
        if (pkIndex !== -1) {
          columnDefinitions[pkIndex] += ' PRIMARY KEY';
        }
      } else {
        // Multi-column primary key - must be separate constraint
        constraints.push(`  PRIMARY KEY (${primaryKeyColumns.join(', ')})`);
      }
    }

    // Add foreign key constraints
    const tableForeignKeys = schema.relations.filter(rel => rel.sourceTable === table.name);
    const groupedForeignKeys = new Map<string, Relation[]>();
    
    // Group foreign keys by constraint name or create unique groups
    for (const relation of tableForeignKeys) {
      const key = relation.constraintName || `${relation.sourceColumn}_${relation.targetTable}_${relation.targetColumn}`;
      if (!groupedForeignKeys.has(key)) {
        groupedForeignKeys.set(key, []);
      }
      groupedForeignKeys.get(key)!.push(relation);
    }

    for (const [constraintKey, relations] of groupedForeignKeys) {
      const sourceColumns = relations.map(rel => rel.sourceColumn);
      const targetColumns = relations.map(rel => rel.targetColumn);
      const targetTable = relations[0].targetTable;
      const constraintName = relations[0].constraintName;
      const onDelete = relations[0].onDelete;
      const onUpdate = relations[0].onUpdate;

      let constraintDef = '  ';
      if (constraintName) {
        constraintDef += `CONSTRAINT ${constraintName} `;
      }
      
      constraintDef += `FOREIGN KEY (${sourceColumns.join(', ')}) REFERENCES ${targetTable} (${targetColumns.join(', ')})`;
      
      if (onDelete) {
        constraintDef += ` ON DELETE ${onDelete.replace('_', ' ')}`;
      }
      
      if (onUpdate) {
        constraintDef += ` ON UPDATE ${onUpdate.replace('_', ' ')}`;
      }

      constraints.push(constraintDef);
    }

    // Combine all parts
    const allDefinitions = [...columnDefinitions, ...constraints];
    const createTableSql = `CREATE TABLE ${table.name} (\n${allDefinitions.join(',\n')}\n);`;
    sqlStatements.push(createTableSql);
  }

  return sqlStatements.join('\n\n');
}

function extractForeignKeyFromConstraint(constraint: any, sourceColumns: string[]): ForeignKeyConstraint | null {
  if (!constraint.pktable) {
    return null;
  }

  const targetTable = constraint.pktable.relname;
  // Handle both pk_attrs (ALTER TABLE) and direct column references
  const targetColumns = constraint.pk_attrs 
    ? constraint.pk_attrs.map((attr: any) => attr.String.str)
    : [constraint.pktable.relname]; // fallback
  
  let onDelete: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION' | undefined;
  let onUpdate: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION' | undefined;

  // Extract referential actions
  if (constraint.fk_del_action) {
    switch (constraint.fk_del_action) {
      case 'a': onDelete = 'NO_ACTION'; break;
      case 'r': onDelete = 'RESTRICT'; break;
      case 'c': onDelete = 'CASCADE'; break;
      case 'n': onDelete = 'SET_NULL'; break;
    }
  }

  if (constraint.fk_upd_action) {
    switch (constraint.fk_upd_action) {
      case 'a': onUpdate = 'NO_ACTION'; break;
      case 'r': onUpdate = 'RESTRICT'; break;
      case 'c': onUpdate = 'CASCADE'; break;
      case 'n': onUpdate = 'SET_NULL'; break;
    }
  }

  return {
    constraintName: constraint.conname || undefined,
    sourceColumns,
    targetTable,
    targetColumns,
    onDelete,
    onUpdate,
  };
}
