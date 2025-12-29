import { ApplicationError, ErrorCategory } from './types';
import { createError, createUnknownError } from './error-handler';

/**
 * PostgreSQL error code patterns
 */
const PG_ERROR_PATTERNS: Record<string, string> = {
  '28P01': 'AUTHENTICATION_FAILED',
  '28000': 'AUTHENTICATION_FAILED',
  '3D000': 'DATABASE_NOT_FOUND',
  '42P01': 'SYNTAX_ERROR',
  '42601': 'SYNTAX_ERROR',
  '08001': 'CONNECTION_REFUSED',
  '08006': 'CONNECTION_TIMEOUT',
  '57P01': 'CONNECTION_TIMEOUT'
};

/**
 * Error message patterns for classification
 */
const ERROR_MESSAGE_PATTERNS: Array<{ pattern: RegExp; errorCode: string }> = [
  { pattern: /ECONNREFUSED/i, errorCode: 'CONNECTION_REFUSED' },
  { pattern: /ETIMEDOUT|timeout/i, errorCode: 'CONNECTION_TIMEOUT' },
  { pattern: /ENOTFOUND|getaddrinfo/i, errorCode: 'NETWORK_ERROR' },
  { pattern: /password authentication failed/i, errorCode: 'AUTHENTICATION_FAILED' },
  { pattern: /database .* does not exist/i, errorCode: 'DATABASE_NOT_FOUND' },
  { pattern: /permission denied/i, errorCode: 'PERMISSION_DENIED' },
  { pattern: /ENOENT|no such file/i, errorCode: 'FILE_NOT_FOUND' },
  { pattern: /EACCES/i, errorCode: 'PERMISSION_DENIED' },
  { pattern: /ENOSPC|no space/i, errorCode: 'DISK_FULL' },
  { pattern: /ENAMETOOLONG/i, errorCode: 'PATH_TOO_LONG' },
  { pattern: /syntax error/i, errorCode: 'SYNTAX_ERROR' },
  { pattern: /unexpected token/i, errorCode: 'SYNTAX_ERROR' },
  { pattern: /parse error/i, errorCode: 'SYNTAX_ERROR' }
];

/**
 * Classify an error and return an ApplicationError
 */
export function classifyError(
  error: Error | unknown,
  context?: Record<string, unknown>
): ApplicationError {
  const err = error instanceof Error ? error : new Error(String(error));
  const errorAny = error as any;
  
  // Check for PostgreSQL error codes
  if (errorAny?.code && typeof errorAny.code === 'string') {
    const pgErrorCode = PG_ERROR_PATTERNS[errorAny.code];
    if (pgErrorCode) {
      return createError(pgErrorCode, err, context);
    }
  }
  
  // Check error message patterns
  const message = err.message || '';
  for (const { pattern, errorCode } of ERROR_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return createError(errorCode, err, context);
    }
  }
  
  // Return unknown error if no pattern matches
  return createUnknownError(err, context);
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: ApplicationError): boolean {
  return error.recoverable;
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: ApplicationError): boolean {
  const retryableCategories: ErrorCategory[] = [
    'database_connection',
    'network'
  ];
  
  const retryableCodes = [
    'DB_001', // CONNECTION_TIMEOUT
    'DB_004', // CONNECTION_REFUSED
    'DB_005'  // NETWORK_ERROR
  ];
  
  return (
    error.recoverable &&
    (retryableCategories.includes(error.category) || retryableCodes.includes(error.code))
  );
}

/**
 * Get a user-friendly error message with context
 */
export function getUserFriendlyMessage(error: ApplicationError): string {
  let message = error.userMessage;
  
  if (error.context) {
    if (error.context.filePath) {
      message += `\n\nFile: ${error.context.filePath}`;
    }
    if (error.context.connectionString) {
      // Mask password in connection string
      const maskedConnection = String(error.context.connectionString).replace(
        /:[^:@]+@/,
        ':****@'
      );
      message += `\n\nConnection: ${maskedConnection}`;
    }
  }
  
  return message;
}
