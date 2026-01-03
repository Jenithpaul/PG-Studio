import React from 'react';
import type { Table } from '@pg-studio/shared';
import './TableDetailsPanel.css';

interface TableDetailsPanelProps {
  table: Table | null;
  onClose: () => void;
  onViewSql: () => void;
}

export const TableDetailsPanel: React.FC<TableDetailsPanelProps> = ({ table, onClose, onViewSql }) => {
  if (!table) return null;

  const primaryKeys = table.columns.filter(c => c.isPrimaryKey);
  const foreignKeys = table.columns.filter(c => c.isForeignKey);

  return (
    <div className="details-panel">
      <div className="details-header">
        <div className="details-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <h3>{table.name}</h3>
        </div>
        <button className="close-panel-btn" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="details-body">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{table.columns.length}</span>
            <span className="stat-label">Columns</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{primaryKeys.length}</span>
            <span className="stat-label">Primary Keys</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{foreignKeys.length}</span>
            <span className="stat-label">Foreign Keys</span>
          </div>
        </div>

        {/* Columns List */}
        <div className="columns-section">
          <h4>Columns</h4>
          <div className="columns-table">
            <div className="columns-header">
              <span>Name</span>
              <span>Type</span>
              <span>Nullable</span>
            </div>
            {table.columns.map((col, idx) => (
              <div key={idx} className="column-row">
                <span className="col-name">
                  {col.isPrimaryKey && <span className="key-badge pk">PK</span>}
                  {col.isForeignKey && <span className="key-badge fk">FK</span>}
                  {col.name}
                </span>
                <span className="col-type">{col.type}</span>
                <span className={`col-nullable ${col.isNullable ? 'yes' : 'no'}`}>
                  {col.isNullable ? 'Yes' : 'No'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Single View SQL Action */}
        <div className="details-actions">
          <button className="action-btn primary full-width" onClick={onViewSql}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            View SQL
          </button>
        </div>
      </div>
    </div>
  );
};
