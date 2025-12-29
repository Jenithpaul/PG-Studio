import React, { useState, useCallback, useRef, useEffect } from 'react';
import './DropZone.css';

interface DropZoneProps {
  onFilesDropped: (filePaths: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface DragState {
  isDragging: boolean;
  isValidDrop: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, disabled = false, children }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isValidDrop: false
  });
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      // Check if any items are files
      const hasFiles = Array.from(e.dataTransfer.items).some(item => item.kind === 'file');
      setDragState({
        isDragging: true,
        isValidDrop: hasFiles
      });
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setDragState({
        isDragging: false,
        isValidDrop: false
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    setDragState({
      isDragging: false,
      isValidDrop: false
    });
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    // Get file paths - in Electron, we can access the path property
    const filePaths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File & { path?: string };
      if (file.path) {
        filePaths.push(file.path);
      }
    }
    
    if (filePaths.length > 0) {
      // Validate files through Electron if available
      if (window.electron?.validateDrop) {
        const { validFiles, invalidFiles } = await window.electron.validateDrop(filePaths);
        
        if (invalidFiles.length > 0) {
          console.warn('Some files were not valid SQL files:', invalidFiles);
        }
        
        if (validFiles.length > 0) {
          onFilesDropped(validFiles);
        }
      } else {
        // Fallback: filter by extension
        const sqlFiles = filePaths.filter(path => path.toLowerCase().endsWith('.sql'));
        if (sqlFiles.length > 0) {
          onFilesDropped(sqlFiles);
        }
      }
    }
  }, [disabled, onFilesDropped]);

  // Reset drag counter when component unmounts or disabled changes
  useEffect(() => {
    return () => {
      dragCounterRef.current = 0;
    };
  }, [disabled]);

  return (
    <div
      className={`drop-zone ${dragState.isDragging ? 'dragging' : ''} ${dragState.isValidDrop ? 'valid-drop' : ''} ${disabled ? 'disabled' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {dragState.isDragging && (
        <div className="drop-overlay">
          <div className="drop-message">
            <svg className="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Drop SQL files here</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropZone;
