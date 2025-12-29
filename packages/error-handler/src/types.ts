/**
 * Error categories for the PostgreSQL Schema Visualizer
 */
export type ErrorCategory = 
  | 'database_connection'
  | 'sql_parsing'
  | 'file_system'
  | 'memory'
  | 'network'
  | 'ui'
  | 'export'
  | 'unknown';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Structured application error with metadata
 */
export interface ApplicationError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestedActions: string[];
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Result of an error recovery attempt
 */
export interface RecoveryResult {
  success: boolean;
  partialData?: unknown;
  userMessage: string;
  suggestedActions: string[];
  retryable: boolean;
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
  canRecover(error: ApplicationError): boolean;
  recover(error: ApplicationError): Promise<RecoveryResult>;
  fallback(error: ApplicationError): Promise<void>;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  logErrors: boolean;
  reportErrors: boolean;
  defaultRetryConfig: RetryConfig;
}
