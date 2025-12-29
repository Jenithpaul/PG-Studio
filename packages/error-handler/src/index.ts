// Types
export * from './types';

// Error codes
export { DATABASE_ERRORS, type ErrorCodeDefinition } from './error-codes';
export { SQL_PARSING_ERRORS, FILE_SYSTEM_ERRORS } from './sql-error-codes';

// Error handler
export {
  DEFAULT_RETRY_CONFIG,
  DEFAULT_ERROR_HANDLER_CONFIG,
  createError,
  createUnknownError
} from './error-handler';

// Retry handler
export {
  withRetry,
  withRetryRecovery,
  DATABASE_RETRY_CONFIG,
  FILE_SYSTEM_RETRY_CONFIG,
  NETWORK_RETRY_CONFIG
} from './retry-handler';

// Error classifier
export {
  classifyError,
  isRecoverableError,
  shouldRetry,
  getUserFriendlyMessage
} from './error-classifier';
