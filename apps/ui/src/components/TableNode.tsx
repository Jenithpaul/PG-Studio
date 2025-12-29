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

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query || query.trim() === '') return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-highlight">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

const TableNode = ({ data }: TableNodeData) => {
  const { table, isHighlighted, isDimmed, isSelected, searchQuery } = data;

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
          <TableIcon />
        </div>
        <div className={`table-node-title ${isHighlighted ? 'highlighted' : ''}`}>
          {searchQuery ? highlightText(table.name, searchQuery) : table.name}
        </div>
        <div className="table-node-badge">
          {table.columns.length} cols
        </div>
      </div>

      {/* Columns */}
      <div className="table-node-columns">
        {table.columns.map(col => (
          <div key={col.id} className="table-column-row">
            {/* Left Handle */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.name}-target`}
              className={`${col.isPrimaryKey ? 'pk-handle' : 'default-handle'}`}
            />
            
            {/* Column Icon */}
            <div className={`column-icon ${col.isPrimaryKey ? 'pk' : col.isForeignKey ? 'fk' : ''}`}>
              {col.isPrimaryKey ? <KeyIcon /> : col.isForeignKey ? <LinkIcon /> : null}
            </div>
            
            {/* Column Name */}
            <span className={`column-name ${col.isPrimaryKey ? 'pk' : ''}`}>
              {searchQuery ? highlightText(col.name, searchQuery) : col.name}
            </span>
            
            {/* Column Type */}
            <span className="column-type">{col.type}</span>
            
            {/* Nullable */}
            {col.isNullable && (
              <span className="column-nullable">?</span>
            )}
            
            {/* Right Handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.name}-source`}
              className={`${col.isForeignKey ? 'fk-handle' : 'default-handle'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Icon Components
const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default React.memo(TableNode);
