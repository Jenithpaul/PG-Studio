import { ErrorCategory, ErrorSeverity } from './types';

/**
 * Error code definitions with metadata
 */
export interface ErrorCodeDefinition {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  defaultMessage: string;
  userMessage: string;
  suggestedActions: string[];
  recoverable: boolean;
}

/**
 * Database connection error codes
 */
export const DATABASE_ERRORS: Record<string, ErrorCodeDefinition> = {
  CONNECTION_TIMEOUT: {
    code: 'DB_001',
    category: 'database_connection',
    severity: 'error',
    defaultMessage: 'Database connection timed out',
    userMessage: 'Unable to connect to the database. The connection timed out.',
    suggestedActions: [
      'Check if the database server is running',
      'Verify the connection string is correct',
      'Check network connectivity',
      'Try increasing the connection timeout'
    ],
    recoverable: true
  },
  AUTHENTICATION_FAILED: {
    code: 'DB_002',
    category: 'database_connection',
    severity: 'error',
    defaultMessage: 'Database authentication failed',
    userMessage: 'Unable to authenticate with the database.',
    suggestedActions: [
      'Verify your username and password',
      'Check if the user has access to the database',
      'Ensure the database accepts connections from your IP'
    ],
    recoverable: false
  },
  DATABASE_NOT_FOUND: {
    code: 'DB_003',
    category: 'database_connection',
    severity: 'error',
    defaultMessage: 'Database not found',
    userMessage: 'The specified database does not exist.',
    suggestedActions: [
      'Verify the database name in your connection string',
      'Check if the database has been created',
      'Contact your database administrator'
    ],
    recoverable: false
  },
  CONNECTION_REFUSED: {
    code: 'DB_004',
    category: 'database_connection',
    severity: 'error',
    defaultMessage: 'Database connection refused',
    userMessage: 'The database server refused the connection.',
    suggestedActions: [
      'Check if PostgreSQL is running',
      'Verify the host and port are correct',
      'Check firewall settings'
    ],
    recoverable: true
  },
  NETWORK_ERROR: {
    code: 'DB_005',
    category: 'network',
    severity: 'error',
    defaultMessage: 'Network error while connecting to database',
    userMessage: 'A network error occurred while connecting to the database.',
    suggestedActions: [
      'Check your internet connection',
      'Verify the database host is reachable',
      'Try again in a few moments'
    ],
    recoverable: true
  }
};
