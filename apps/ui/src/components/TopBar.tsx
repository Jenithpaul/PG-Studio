import React, { useState } from 'react';
import type { LayoutAlgorithm } from '@pg-studio/layout-engine';
import ThemeToggle from './ThemeToggle';
import './TopBar.css';

type DataSource = 'db' | 'folder' | 'demo';

type TopBarProps = {
  onVisualize: (source: DataSource, value: string) => void;
  onAutoLayout: (algorithm: LayoutAlgorithm) => void;
  onZoomToFit: () => void;
  onBackToDashboard?: () => void;
  onImport?: () => void;
  onSave?: () => void;
  onShare?: () => void;
};

const TopBar = ({ onVisualize, onAutoLayout, onZoomToFit, onBackToDashboard, onImport, onSave, onShare }: TopBarProps) => { 
  const [url, setUrl] = useState('postgres://localhost:5432/postgres');

  return (
    <div className="visualizer-topbar">
      {/* Left: Back Button + URL Input */}
      <div className="topbar-left">
         <button 
           className="icon-button back-button" 
           onClick={onBackToDashboard} 
           title="Back to Dashboard"
         >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
             </svg>
         </button>
         
         <div className="url-bar">
             <div className="url-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
             </div>
             <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="url-input"
             />
             <button className="url-action-btn" onClick={() => onVisualize('db', url)}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M5 12h14M12 5l7 7-7 7" />
                 </svg>
             </button>
         </div>
      </div>

      {/* Right: Actions */}
      <div className="topbar-right">
         <button className="text-button" onClick={onImport}>
            Import
         </button>
         
         <button className="text-button primary" onClick={onSave}>
            Save
         </button>
         
         <button className="text-button share-btn" onClick={onShare} title="Share / Export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <circle cx="18" cy="5" r="3"/>
               <circle cx="6" cy="12" r="3"/>
               <circle cx="18" cy="19" r="3"/>
               <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
               <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
         </button>
         
         <div className="divider-vertical"></div>

         <button className="icon-button" onClick={() => onAutoLayout('hierarchical')} title="Auto Layout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
         </button>
         
         <button className="icon-button" onClick={onZoomToFit} title="Fit View">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
            </svg>
         </button>
         
         <div className="divider-vertical"></div>
         
         <ThemeToggle size="sm" />
      </div>
    </div>
  );
};

export default TopBar;
