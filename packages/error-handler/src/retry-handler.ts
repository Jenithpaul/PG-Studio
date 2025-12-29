import { RetryConfig, ApplicationError, RecoveryResult } from './types';
import { DEFAULT_RETRY_CONFIG } from './error-handler';

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        
        if (onRetry) {
          onRetry(attempt + 1, lastError, delay);
        }
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with retry logic, returning a RecoveryResult
 */
export async function withRetryRecovery<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error, delay: number) => void
): Promise<RecoveryResult & { data?: T }> {
  try {
    const data = await withRetry(fn, config, onRetry);
    return {
      success: true,
      data,
      userMessage: 'Operation completed successfully',
      suggestedActions: [],
      retryable: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      userMessage: `Operation failed after ${config.maxRetries + 1} attempts: ${errorMessage}`,
      suggestedActions: [
        'Check your connection settings',
        'Verify the service is available',
        'Try again later'
      ],
      retryable: true
    };
  }
}

/**
 * Database connection retry configuration
 */
export const DATABASE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2
};

/**
 * File system retry configuration (fewer retries, shorter delays)
 */
export const FILE_SYSTEM_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  backoffMultiplier: 2
};

/**
 * Network retry configuration (more retries, longer delays)
 */
export const NETWORK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};
