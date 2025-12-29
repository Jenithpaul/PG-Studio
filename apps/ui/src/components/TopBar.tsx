import React from 'react';
import type { LayoutAlgorithm } from '@pg-studio/layout-engine';
import ThemeToggle from './ThemeToggle';
import './ThemeToggle.css';
import './TopBar.css';

type DataSource = 'db' | 'folder' | 'demo';

type TopBarProps = {
  onVisualize: (source: DataSource, value: string) => void;
  onAutoLayout: (algorithm: LayoutAlgorithm) => void;
  onZoomToFit: () => void;
  onExport: () => void;
  hasSchema: boolean;
  onBackToDashboard?: () => void;
};

const TopBar = ({ onVisualize, onAutoLayout, onZoomToFit, onExport, hasSchema, onBackToDashboard }: TopBarProps) => {
  const [source, setSource] = React.useState<DataSource>('demo');
  const [connectionString, setConnectionString] = React.useState('postgresql://postgres:postgres@localhost:5432/postgres');
  const [folderPath, setFolderPath] = React.useState('');
  const [layoutAlgorithm, setLayoutAlgorithm] = React.useState<LayoutAlgorithm>('hierarchical');

  const handleSelectFolder = async () => {
    if (window.electron) {
      const path = await window.electron.openDialog();
      if (path) {
        setFolderPath(path);
      }
    } else {
      alert('Folder selection is only available in the desktop app.');
    }
  };

  const handleVisualize = () => {
    if (source === 'db') {
      onVisualize('db', connectionString);
    } else if (source === 'demo') {
      onVisualize('demo', 'Demo Data');
    } else {
      if (folderPath) {
        onVisualize('folder', folderPath);
      } else {
        handleSelectFolder();
      }
    }
  };

  const handleAutoLayout = () => {
    onAutoLayout(layoutAlgorithm);
  };

  const renderSourceInput = () => {
    switch (source) {
      case 'db':
        return (
          <input
            type="text"
            value={connectionString}
            onChange={e => setConnectionString(e.target.value)}
            placeholder="postgresql://user:pass@host:port/database"
            className="connection-input"
            spellCheck={false}
          />
        );
      case 'folder':
        return (
          <button 
            onClick={handleSelectFolder}
            className={`folder-select-btn ${folderPath ? 'has-path' : ''}`}
          >
            {folderPath || 'Select project folder...'}
          </button>
        );
      case 'demo':
        return (
          <div className="demo-info">
            <span className="demo-badge">Sample e-commerce schema</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="top-bar">
      {/* Logo */}
      {/* Logo */}
      <div 
        className={`top-bar-logo ${onBackToDashboard ? 'clickable' : ''}`}
        onClick={onBackToDashboard}
        title={onBackToDashboard ? "Back to Dashboard" : undefined}
      >
        {onBackToDashboard && (
          <div className="top-bar-back-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
        )}
        <div className="top-bar-logo-icon">PG</div>
        <div className="top-bar-logo-text">
          <span>PG</span> Studio
        </div>
      </div>

      {/* Data Source Section */}
      <div className="top-bar-section source-section">
        <select 
          value={source} 
          onChange={e => setSource(e.target.value as DataSource)}
          className="source-select"
        >
          <option value="demo">Demo Mode</option>
          <option value="db">Live Database</option>
          <option value="folder">SQL Folder</option>
        </select>

        {renderSourceInput()}

        <button onClick={handleVisualize} className="visualize-btn">
          Visualize
        </button>
      </div>

      {/* Separator */}
      <div className="separator" />

      {/* Layout Section */}
      <div className="top-bar-section">
        <select 
          value={layoutAlgorithm} 
          onChange={e => setLayoutAlgorithm(e.target.value as LayoutAlgorithm)}
          disabled={!hasSchema}
          title="Select layout algorithm"
          className="layout-select"
        >
          <option value="hierarchical">Hierarchical</option>
          <option value="force_directed">Force Directed</option>
          <option value="grid">Grid</option>
          <option value="circular">Circular</option>
        </select>

        <button 
          onClick={handleAutoLayout}
          disabled={!hasSchema}
          title="Apply auto-layout to arrange tables"
          className={`action-btn layout-btn ${hasSchema ? 'enabled' : ''}`}
        >
          <LayoutIcon />
          <span>Layout</span>
        </button>

        <button 
          onClick={onZoomToFit}
          disabled={!hasSchema}
          title="Zoom to fit all tables in view"
          className={`action-btn fit-btn ${hasSchema ? 'enabled' : ''}`}
        >
          <FitIcon />
          <span>Fit</span>
        </button>

        <button 
          onClick={onExport}
          disabled={!hasSchema}
          title="Export schema visualization"
          className={`action-btn export-btn ${hasSchema ? 'enabled' : ''}`}
        >
          <ExportIcon />
          <span>Export</span>
        </button>
      </div>

      {/* Theme Toggle */}
      <div className="top-bar-section">
        <ThemeToggle size="md" />
      </div>
    </div>
  );
};

// Icon Components
const LayoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const FitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
);

const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default TopBar;
