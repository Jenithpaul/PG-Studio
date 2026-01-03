import React from 'react';
import { Handle, Position } from 'reactflow';
import type { Table } from '@pg-studio/shared';
import './TableNode.css';

type TableNodeData = {
  data: {
    label: string;
    table: Table;
    isHighlighted?: boolean;
    isDimmed?: boolean;
    isSelected?: boolean;
    searchQuery?: string;
  };
};

const TableNode = ({ data }: TableNodeData) => {
  const { table, isHighlighted, isDimmed, isSelected } = data;

  const nodeClasses = [
    'table-node',
    isHighlighted && 'highlighted',
    isDimmed && 'dimmed',
    isSelected && 'selected'
  ].filter(Boolean).join(' ');

  return (
    <div className={nodeClasses}>
      {/* Header */}
      <div className="table-node-header">
        <div className="table-node-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <div className="table-node-title">
          {table.name}
        </div>
        <span className="table-node-badge">
          {table.columns.length} cols
        </span>
      </div>

      {/* Columns */}
      <div className="table-node-columns">
        {table.columns.map(col => (
          <div key={col.id} className="table-column-row">
            {/* Left Handles */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.name}-target`}
              className="node-handle left"
            />
            
            {/* Primary Key / Foreign Key Indicators */}
            <div className="column-status-icon">
              {col.isPrimaryKey && (
                 <svg className="key-icon" viewBox="0 0 24 24" fill="#fbbf24">
                   <path d="M7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM12.65 10c.02-.13.05-.26.05-.4 0-.14-.03-.27-.05-.4l5.35-5.35H21v3h-2v2h-2v-1l-4.35 4.35z"/>
                 </svg>
              )}
              {col.isForeignKey && !col.isPrimaryKey && (
                <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                </svg>
              )}
               {/* Dot for normal columns if wanted, otherwise empty */}
               {!col.isPrimaryKey && !col.isForeignKey && (
                   <div className="dot-icon"></div>
               )}
            </div>
            
            <span className={`column-name ${col.isPrimaryKey ? 'primary' : ''}`}>
              {col.name}
            </span>
            
            <span className="column-type">{col.type}</span>
            {col.isNullable && <span className="column-nullable">?</span>}
            
             {/* Right Handles */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.name}-source`}
              className="node-handle right"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(TableNode);
