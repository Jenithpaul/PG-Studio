import './ErrorDisplay.css';

export interface ErrorInfo {
  error: string;
  code?: string;
  userMessage: string;
  suggestedActions: string[];
  recoverable: boolean;
  details?: Record<string, unknown>;
}

interface ErrorDisplayProps {
  error: ErrorInfo | string;
  onClose: () => void;
  onRetry?: () => void;
  variant?: 'error' | 'warning';
}

/**
 * User-friendly error display component with suggested actions
 */
export function ErrorDisplay({ 
  error, 
  onClose, 
  onRetry,
  variant = 'error' 
}: ErrorDisplayProps) {
  // Handle both string errors and structured ErrorInfo
  const errorInfo: ErrorInfo = typeof error === 'string' 
    ? {
        error,
        userMessage: error,
        suggestedActions: ['Try the operation again', 'Check your settings'],
        recoverable: true
      }
    : error;
  
  return (
    <div className={`error-display ${variant}`}>
      <div className="error-header">
        <div className="error-icon">!</div>
        <div className="error-title">
          {variant === 'error' ? 'Error' : 'Warning'}
          {errorInfo.code && ` (${errorInfo.code})`}
        </div>
        <button 
          className="error-close" 
          onClick={onClose}
          aria-label="Close error"
        >
          ✕
        </button>
      </div>
      
      <div className="error-body">
        <div className="error-message">{errorInfo.userMessage}</div>
        
        {errorInfo.error !== errorInfo.userMessage && (
          <div className="error-details">
            {errorInfo.error}
          </div>
        )}
        
        {errorInfo.suggestedActions.length > 0 && (
          <>
            <div className="error-actions-title">Suggested Actions:</div>
            <ul className="error-actions-list">
              {errorInfo.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      
      <div className="error-footer">
        <button className="error-btn error-btn-secondary" onClick={onClose}>
          Dismiss
        </button>
        {errorInfo.recoverable && onRetry && (
          <button className="error-btn error-btn-primary" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple inline error message
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div style={{ 
      color: '#c62828', 
      padding: '8px 12px', 
      background: '#ffebee',
      borderRadius: '6px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontWeight: 'bold' }}>!</span>
      {message}
    </div>
  );
}

export default ErrorDisplay;
