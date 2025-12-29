import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { getDatabaseSchema } from '@pg-studio/introspection';
import { parseSql } from '@pg-studio/schema-parser';
import { createFileScanner } from '@pg-studio/file-scanner';
import { createSchemaBuilder } from '@pg-studio/schema-builder';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const fileScanner = createFileScanner();
const schemaBuilder = createSchemaBuilder();

/**
 * Enhanced error response with user-friendly messages
 */
interface ErrorResponse {
  error: string;
  code?: string;
  userMessage: string;
  suggestedActions: string[];
  recoverable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Create an enhanced error response
 */
function createErrorResponse(
  error: Error | unknown,
  context?: Record<string, unknown>
): ErrorResponse {
  const err = error instanceof Error ? error : new Error(String(error));
  const errorAny = error as any;
  
  // Extract error code if available
  const code = errorAny?.code || 'UNKNOWN_ERROR';
  
  // Determine user message and suggested actions based on error type
  const { userMessage, suggestedActions, recoverable } = getErrorDetails(err, code);
  
  return {
    error: err.message,
    code,
    userMessage,
    suggestedActions,
    recoverable,
    details: context
  };
}

/**
 * Get user-friendly error details based on error type
 */
function getErrorDetails(error: Error, code: string): {
  userMessage: string;
  suggestedActions: string[];
  recoverable: boolean;
} {
  const message = error.message.toLowerCase();
  
  // Database connection errors
  if (code === 'ECONNREFUSED' || message.includes('econnrefused')) {
    return {
      userMessage: 'Unable to connect to the database. The connection was refused.',
      suggestedActions: [
        'Check if PostgreSQL is running',
        'Verify the host and port are correct',
        'Check firewall settings'
      ],
      recoverable: true
    };
  }
  
  if (code === '28P01' || message.includes('password authentication failed')) {
    return {
      userMessage: 'Database authentication failed.',
      suggestedActions: [
        'Verify your username and password',
        'Check if the user has access to the database',
        'Ensure the database accepts connections from your IP'
      ],
      recoverable: false
    };
  }
  
  if (code === '3D000' || message.includes('does not exist')) {
    return {
      userMessage: 'The specified database does not exist.',
      suggestedActions: [
        'Verify the database name in your connection string',
        'Check if the database has been created',
        'Contact your database administrator'
      ],
      recoverable: false
    };
  }
  
  if (message.includes('timeout')) {
    return {
      userMessage: 'The database connection timed out.',
      suggestedActions: [
        'Check network connectivity',
        'Verify the database server is responsive',
        'Try again in a few moments'
      ],
      recoverable: true
    };
  }
  
  // File system errors
  if (code === 'ENOENT' || message.includes('no such file')) {
    return {
      userMessage: 'The specified file or folder could not be found.',
      suggestedActions: [
        'Verify the path is correct',
        'Check if the file has been moved or deleted',
        'Select a different location'
      ],
      recoverable: false
    };
  }
  
  if (code === 'EACCES' || code === 'EPERM' || message.includes('permission denied')) {
    return {
      userMessage: 'Access to the file or folder was denied.',
      suggestedActions: [
        'Check file/folder permissions',
        'Run the application with appropriate permissions',
        'Select a different folder'
      ],
      recoverable: false
    };
  }
  
  // SQL parsing errors
  if (message.includes('syntax error') || message.includes('parse error')) {
    return {
      userMessage: 'The SQL file contains syntax errors.',
      suggestedActions: [
        'Check the SQL syntax in the file',
        'Verify the SQL is valid PostgreSQL syntax',
        'Look for missing semicolons or brackets'
      ],
      recoverable: true
    };
  }
  
  // Default error
  return {
    userMessage: 'An unexpected error occurred.',
    suggestedActions: [
      'Try the operation again',
      'Check the logs for more details',
      'Contact support if the issue persists'
    ],
    recoverable: true
  };
}

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

app.post('/api/schema/db', async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).send({ error: 'connectionString is required' });
  }
  try {
    // Use schema builder for enhanced metadata
    const schemaSource = await schemaBuilder.buildFromDatabase(connectionString);
    const enhancedSchema = await schemaBuilder.buildFromSources([schemaSource]);
    res.send(enhancedSchema);
  } catch (error: any) {
    console.error('Database schema error:', error);
    const errorResponse = createErrorResponse(error, { connectionString: connectionString.replace(/:[^:@]+@/, ':****@') });
    res.status(500).send(errorResponse);
  }
});

app.post('/api/schema/files', async (req, res) => {
  const { sql, filePaths } = req.body;
  if (!sql) {
    return res.status(400).send({ error: 'sql is required' });
  }
  try {
    // Use schema builder for enhanced metadata
    const paths = filePaths || ['inline-sql'];
    const schemaSource = await schemaBuilder.buildFromSqlFiles(paths);
    // Override the schema with the provided SQL
    schemaSource.schema = await parseSql(sql);
    const enhancedSchema = await schemaBuilder.buildFromSources([schemaSource]);
    res.send(enhancedSchema);
  } catch (error: any) {
    console.error('SQL parsing error:', error);
    const errorResponse = createErrorResponse(error, { filePaths });
    res.status(500).send(errorResponse);
  }
});

// New endpoint for scanning project folders
app.post('/api/project/scan', async (req, res) => {
  const { projectPath } = req.body;
  if (!projectPath) {
    return res.status(400).send({ error: 'projectPath is required' });
  }
  
  try {
    const scanResult = await fileScanner.scanProject(projectPath);
    res.send(scanResult);
  } catch (error: any) {
    console.error('Project scan error:', error);
    const errorResponse = createErrorResponse(error, { projectPath });
    res.status(500).send(errorResponse);
  }
});

// Enhanced endpoint for parsing SQL files from scan results using schema builder
app.post('/api/schema/project', async (req, res) => {
  const { projectPath } = req.body;
  if (!projectPath) {
    return res.status(400).send({ error: 'projectPath is required' });
  }
  
  try {
    // Use schema builder for enhanced project schema building
    const schemaSource = await schemaBuilder.buildFromProject(projectPath);
    const enhancedSchema = await schemaBuilder.buildFromSources([schemaSource]);
    res.send(enhancedSchema);
  } catch (error: any) {
    console.error('Project schema parsing error:', error);
    const errorResponse = createErrorResponse(error, { projectPath });
    res.status(500).send(errorResponse);
  }
});

// New endpoint for multi-source schema building
app.post('/api/schema/multi-source', async (req, res) => {
  const { sources } = req.body;
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return res.status(400).send({ error: 'sources array is required' });
  }
  
  try {
    const schemaSources = [];
    
    for (const sourceConfig of sources) {
      let schemaSource;
      
      switch (sourceConfig.type) {
        case 'database':
          if (!sourceConfig.connectionString) {
            throw new Error('connectionString is required for database sources');
          }
          schemaSource = await schemaBuilder.buildFromDatabase(sourceConfig.connectionString);
          break;
          
        case 'project':
          if (!sourceConfig.projectPath) {
            throw new Error('projectPath is required for project sources');
          }
          schemaSource = await schemaBuilder.buildFromProject(sourceConfig.projectPath);
          break;
          
        case 'files':
          if (!sourceConfig.filePaths || !Array.isArray(sourceConfig.filePaths)) {
            throw new Error('filePaths array is required for file sources');
          }
          schemaSource = await schemaBuilder.buildFromSqlFiles(sourceConfig.filePaths);
          break;
          
        default:
          throw new Error(`Unsupported source type: ${sourceConfig.type}`);
      }
      
      // Override priority if specified
      if (sourceConfig.priority !== undefined) {
        schemaSource.priority = sourceConfig.priority;
      }
      
      schemaSources.push(schemaSource);
    }
    
    // Build enhanced schema from all sources
    const enhancedSchema = await schemaBuilder.buildFromSources(schemaSources);
    res.send(enhancedSchema);
  } catch (error: any) {
    console.error('Multi-source schema building error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(500).send(errorResponse);
  }
});

// New endpoint for combining database and project sources
app.post('/api/schema/hybrid', async (req, res) => {
  const { connectionString, projectPath, conflictResolution } = req.body;
  
  if (!connectionString && !projectPath) {
    return res.status(400).send({ 
      error: 'At least one of connectionString or projectPath is required' 
    });
  }
  
  try {
    const sources = [];
    
    // Add database source if provided
    if (connectionString) {
      const dbSource = await schemaBuilder.buildFromDatabase(connectionString);
      sources.push(dbSource);
    }
    
    // Add project source if provided
    if (projectPath) {
      const projectSource = await schemaBuilder.buildFromProject(projectPath);
      sources.push(projectSource);
    }
    
    // Build enhanced schema with conflict resolution
    const enhancedSchema = await schemaBuilder.buildFromSources(sources);
    
    // Add conflict resolution metadata
    if (enhancedSchema.conflicts.length > 0) {
      (enhancedSchema.metadata as any).conflictResolution = conflictResolution || 'prefer_database';
    }
    
    res.send(enhancedSchema);
  } catch (error: any) {
    console.error('Hybrid schema building error:', error);
    const errorResponse = createErrorResponse(error, { 
      connectionString: connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : undefined,
      projectPath 
    });
    res.status(500).send(errorResponse);
  }
});


app.listen(port, () => {
  console.log(`Agent is running at http://localhost:${port}`);
});