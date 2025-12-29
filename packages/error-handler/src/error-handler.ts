import {
  ApplicationError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryResult,
  RetryConfig,
  ErrorHandlerConfig
} from './types';
import { DATABASE_ERRORS, ErrorCodeDefinition } from './error-codes';
import { SQL_PARSING_ERRORS, FILE_SYSTEM_ERRORS } from './sql-error-codes';

/**
 * Default retry configuration with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2
};

/**
 * Default error handler configuration
 */
export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  logErrors: true,
  reportErrors: false,
  defaultRetryConfig: DEFAULT_RETRY_CONFIG
};

/**
 * All error code definitions combined
 */
const ALL_ERROR_CODES: Record<string, ErrorCodeDefinition> = {
  ...DATABASE_ERRORS,
  ...SQL_PARSING_ERRORS,
  ...FILE_SYSTEM_ERRORS
};

/**
 * Create an ApplicationError from an error code
 */
export function createError(
  code: string,
  originalError?: Error,
  context?: Record<string, unknown>
): ApplicationError {
  const definition = ALL_ERROR_CODES[code];
  
  if (!definition) {
    return createUnknownError(originalError, context);
  }

  return {
    code: definition.code,
    category: definition.category,
    severity: definition.severity,
    message: definition.defaultMessage,
    userMessage: definition.userMessage,
    suggestedActions: definition.suggestedActions,
    originalError,
    context,
    timestamp: new Date(),
    recoverable: definition.recoverable
  };
}

/**
 * Create an unknown error
 */
export function createUnknownError(
  originalError?: Error,
  context?: Record<string, unknown>
): ApplicationError {
  return {
    code: 'UNKNOWN_001',
    category: 'unknown',
    severity: 'error',
    message: originalError?.message || 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    suggestedActions: [
      'Try the operation again',
      'Restart the application',
      'Check the logs for more details'
    ],
    originalError,
    context,
    timestamp: new Date(),
    recoverable: true
  };
}
