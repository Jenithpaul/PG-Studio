import React from 'react';
import type { Table } from '@pg-studio/shared';
import './VisualizerSidebar.css';

interface VisualizerSidebarProps {
  tables: Table[];
  onSelectTable: (tableId: string) => void;
  selectedTableIds: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'graph' | 'code';
  onViewModeChange: (mode: 'graph' | 'code') => void;
}

const VisualizerSidebar: React.FC<VisualizerSidebarProps> = ({
  tables,
  onSelectTable,
  selectedTableIds,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange
}) => {
  // Filter tables based on search
  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="visualizer-sidebar">
      {/* View Mode Toggle */}
      <div className="view-toggle-container">
          <div className="view-toggle">
              <button 
                className={`toggle-option ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => onViewModeChange('graph')}
              >
                Viewer
              </button>
              <button 
                className={`toggle-option ${viewMode === 'code' ? 'active' : ''}`}
                onClick={() => onViewModeChange('code')}
              >
                Code
              </button>
          </div>
      </div>

      {/* Search Bar */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Search tables..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table List Section Header */}
      <div className="sidebar-section-header">
         <span>SCHEMAS</span>
         <span className="count-badge">{filteredTables.length}</span>
      </div>

      {/* Table List */}
      <div className="sidebar-list">
        {filteredTables.map(table => (
          <div 
            key={table.id}
            className={`sidebar-list-item ${selectedTableIds.includes(table.id) ? 'selected' : ''}`}
            onClick={() => onSelectTable(table.id)}
          >
            <div className="list-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <span className="list-item-name">{table.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default VisualizerSidebar;
