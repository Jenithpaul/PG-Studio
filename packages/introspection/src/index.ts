import { Pool, PoolClient } from 'pg';
import { Table, Column, Relation, Schema } from '@pg-studio/shared';

/**
 * Database connection error with enhanced metadata
 */
export interface DatabaseConnectionError extends Error {
  code?: string;
  connectionString?: string;
  retryable: boolean;
  suggestedActions: string[];
}

/**
 * Create a database connection error with helpful metadata
 */
function createDatabaseError(
  error: Error,
  connectionString: string
): DatabaseConnectionError {
  const dbError = error as DatabaseConnectionError;
  const errorCode = (error as any).code;
  
  // Determine if error is retryable
  const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '08006', '57P01'];
  dbError.retryable = retryableCodes.some(code => 
    errorCode === code || error.message.includes(code)
  );
  
  // Mask password in connection string for logging
  dbError.connectionString = connectionString.replace(/:[^:@]+@/, ':****@');
  
  // Add suggested actions based on error type
  dbError.suggestedActions = getSuggestedActions(error);
  
  return dbError;
}

/**
 * Get suggested actions based on error type
 */
function getSuggestedActions(error: Error): string[] {
  const errorCode = (error as any).code;
  const message = error.message.toLowerCase();
  
  if (errorCode === 'ECONNREFUSED' || message.includes('econnrefused')) {
    return [
      'Check if PostgreSQL is running',
      'Verify the host and port are correct',
      'Check firewall settings'
    ];
  }
  
  if (errorCode === '28P01' || message.includes('password authentication failed')) {
    return [
      'Verify your username and password',
      'Check if the user has access to the database',
      'Ensure the database accepts connections from your IP'
    ];
  }
  
  if (errorCode === '3D000' || message.includes('does not exist')) {
    return [
      'Verify the database name in your connection string',
      'Check if the database has been created',
      'Contact your database administrator'
    ];
  }
  
  if (message.includes('timeout')) {
    return [
      'Check network connectivity',
      'Verify the database server is responsive',
      'Try increasing the connection timeout'
    ];
  }
  
  return [
    'Check your connection settings',
    'Verify the database is accessible',
    'Review the error message for details'
  ];
}

/**
 * Retry configuration for database connections
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute database operation with retry logic
 */
async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  connectionString: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const dbError = createDatabaseError(lastError, connectionString);
      
      // Only retry if the error is retryable
      if (!dbError.retryable || attempt >= config.maxRetries) {
        throw dbError;
      }
      
      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
      );
      
      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Get database schema with retry logic and enhanced error handling
 */
export async function getDatabaseSchema(
  connectionString: string,
  retryConfig?: RetryConfig,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<Schema> {
  return withDatabaseRetry(
    async () => {
      const pool = new Pool({ 
        connectionString,
        connectionTimeoutMillis: 10000, // 10 second timeout
        idleTimeoutMillis: 30000
      });
      
      let client: PoolClient | undefined;
      
      try {
        client = await pool.connect();
        return await fetchSchemaFromClient(client);
      } finally {
        if (client) {
          client.release();
        }
        await pool.end();
      }
    },
    connectionString,
    retryConfig,
    onRetry
  );
}

/**
 * Fetch schema from an established database client
 */
async function fetchSchemaFromClient(client: PoolClient): Promise<Schema> {
  try {
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables: Table[] = [];
    const tableNames = tablesRes.rows.map(row => row.table_name);

    for (const tableName of tableNames) {
      const columnsRes = await client.query(`
        SELECT
          c.column_name,
          c.data_type,
          c.is_nullable,
          (
            SELECT COUNT(*)
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND kcu.table_name = c.table_name
            AND kcu.column_name = c.column_name
          ) > 0 as is_primary_key
        FROM information_schema.columns c
        WHERE c.table_name = $1 AND c.table_schema = 'public'
        ORDER BY c.ordinal_position;
      `, [tableName]);

      const columns: Column[] = columnsRes.rows.map(col => ({
        id: `${tableName}-${col.column_name}`,
        name: col.column_name,
        type: col.data_type,
        isPrimaryKey: col.is_primary_key,
        isForeignKey: false, // This will be updated below
        isNullable: col.is_nullable === 'YES',
      }));

      tables.push({
        id: tableName,
        name: tableName,
        columns: columns,
      });
    }

    const relationsRes = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM
        information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `);

    const relations: Relation[] = relationsRes.rows.map(row => {
      // Mark the column as a foreign key
      const sourceTable = tables.find(t => t.name === row.source_table);
      if (sourceTable) {
        const sourceColumn = sourceTable.columns.find(c => c.name === row.source_column);
        if (sourceColumn) {
          sourceColumn.isForeignKey = true;
        }
      }

      return {
        id: `fk-${row.source_table}-${row.source_column}`,
        sourceTable: row.source_table,
        sourceColumn: row.source_column,
        targetTable: row.target_table,
        targetColumn: row.target_column,
      };
    });

    return { tables, relations };
  } catch (error) {
    // Re-throw with enhanced error information
    const err = error instanceof Error ? error : new Error(String(error));
    throw err;
  }
}
