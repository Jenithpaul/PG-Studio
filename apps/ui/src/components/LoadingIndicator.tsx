import React from 'react';
import './LoadingIndicator.css';

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
  progress?: number;
  showProgress?: boolean;
}

/**
 * Full-screen loading overlay with spinner and optional progress bar
 */
export function LoadingOverlay({
  message = 'Loading...',
  submessage,
  progress,
  showProgress = false
}: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-message">{message}</div>
        {submessage && <div className="loading-submessage">{submessage}</div>}
        {showProgress && progress !== undefined && (
          <>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              />
            </div>
            <div className="progress-text">{Math.round(progress * 100)}%</div>
          </>
        )}
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
}

/**
 * Inline loading indicator for smaller contexts
 */
export function InlineLoading({ message = 'Loading...' }: InlineLoadingProps) {
  return (
    <div className="inline-loading">
      <div className="inline-spinner" />
      <span>{message}</span>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

/**
 * Standalone progress bar component
 */
export function ProgressBar({ 
  progress, 
  label, 
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, progress * 100));
  
  return (
    <div>
      {label && <div className="loading-submessage">{label}</div>}
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="progress-text">{Math.round(percentage)}%</div>
      )}
    </div>
  );
}

interface SkeletonProps {
  variant?: 'text' | 'box';
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  count = 1 
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  const className = variant === 'box' ? 'skeleton skeleton-box' : 'skeleton skeleton-text';
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={className} style={style} />
      ))}
    </>
  );
}

export default LoadingOverlay;
