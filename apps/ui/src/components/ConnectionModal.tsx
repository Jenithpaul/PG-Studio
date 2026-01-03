import React, { useState } from 'react';
import './ConnectionModal.css';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connectionString: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid connection string');
      return;
    }
    // Basic validation
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
        setError('URL must start with postgres:// or postgresql://');
        return;
    }
    onConnect(url);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="connection-modal">
        <div className="modal-header">
           <h3>Connect to Database</h3>
           <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
            <label>Database URL</label>
            <input 
              type="text" 
              placeholder="postgresql://user:password@localhost:5432/dbname" 
              value={url}
              onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
              }}
              autoFocus
            />
            {error && <span className="error-text">{error}</span>}
            
            <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-connect">Connect</button>
            </div>
        </form>
      </div>
    </div>
  );
};
