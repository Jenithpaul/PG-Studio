import { useState, useCallback, useEffect } from 'react';
import './LoadingIndicator.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actions?: string[];
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

/**
 * Individual toast notification
 */
function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);
  
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
        {toast.actions && toast.actions.length > 0 && (
          <div className="toast-message" style={{ marginTop: '4px', fontSize: '12px' }}>
            {toast.actions.map((action, i) => (
              <div key={i}>• {action}</div>
            ))}
          </div>
        )}
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

/**
 * Container for toast notifications
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: { duration?: number; actions?: string[] }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration: options?.duration,
      actions: options?.actions
    };
    
    setToasts(prev => [...prev, toast]);
    return id;
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const success = useCallback((title: string, message?: string) => {
    return addToast('success', title, message);
  }, [addToast]);
  
  const error = useCallback((
    title: string, 
    message?: string, 
    actions?: string[]
  ) => {
    return addToast('error', title, message, { duration: 0, actions });
  }, [addToast]);
  
  const warning = useCallback((title: string, message?: string) => {
    return addToast('warning', title, message, { duration: 7000 });
  }, [addToast]);
  
  const info = useCallback((title: string, message?: string) => {
    return addToast('info', title, message);
  }, [addToast]);
  
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);
  
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
}

export default ToastContainer;
