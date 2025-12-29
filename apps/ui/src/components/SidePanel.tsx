import React from 'react';
import type { Table, Schema } from '@pg-studio/shared';
import './SidePanel.css';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: Table | null;
  schema: Schema | null;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, selectedTable, schema }) => {
  if (!selectedTable || !schema) return null;

  // Find relationships for this table
  const incomingRelations = schema.relations.filter(rel => rel.targetTable === selectedTable.name);
  const outgoingRelations = schema.relations.filter(rel => rel.sourceTable === selectedTable.name);
  const totalRelations = incomingRelations.length + outgoingRelations.length;

  const primaryKeys = selectedTable.columns.filter(col => col.isPrimaryKey);
  const foreignKeys = selectedTable.columns.filter(col => col.isForeignKey);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`side-panel-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="side-panel-header">
          <div className="side-panel-icon">
            <TableIcon />
          </div>
          <div className="side-panel-title-group">
            <h3 className="side-panel-title">{selectedTable.name}</h3>
            <p className="side-panel-subtitle">
              {selectedTable.columns.length} columns • {totalRelations} relationships
            </p>
          </div>
          <button className="side-panel-close" onClick={onClose} title="Close panel">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="side-panel-content">
          {/* Quick Stats */}
          <div className="panel-stats">
            <div className="stat-item">
              <div className="stat-value">{selectedTable.columns.length}</div>
              <div className="stat-label">Columns</div>
            </div>
            <div className="stat-item">
              <div className="stat-value pk">{primaryKeys.length}</div>
              <div className="stat-label">Primary</div>
            </div>
            <div className="stat-item">
              <div className="stat-value fk">{foreignKeys.length}</div>
              <div className="stat-label">Foreign</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{totalRelations}</div>
              <div className="stat-label">Relations</div>
            </div>
          </div>

          {/* Columns Section */}
          <section className="panel-section">
            <div className="panel-section-header">
              <h4 className="panel-section-title">Columns</h4>
              <span className="panel-section-badge">{selectedTable.columns.length}</span>
            </div>
            <div className="column-list">
              {selectedTable.columns.map(column => (
                <div key={column.id} className="column-item">
                  <div className={`column-item-icon ${column.isPrimaryKey ? 'pk' : column.isForeignKey ? 'fk' : ''}`}>
                    {column.isPrimaryKey ? <KeyIcon /> : column.isForeignKey ? <LinkIcon /> : <ColumnIcon />}
                  </div>
                  <div className="column-item-info">
                    <div className="column-item-name">{column.name}</div>
                    <div className="column-item-type">{column.type}</div>
                  </div>
                  <div className="column-item-badges">
                    {column.isPrimaryKey && <span className="column-badge pk">PK</span>}
                    {column.isForeignKey && <span className="column-badge fk">FK</span>}
                    {column.isNullable && <span className="column-badge nullable">NULL</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Outgoing Relationships */}
          {outgoingRelations.length > 0 && (
            <section className="panel-section">
              <div className="panel-section-header">
                <h4 className="panel-section-title">References</h4>
                <span className="panel-section-badge">{outgoingRelations.length}</span>
              </div>
              <div className="relation-list">
                {outgoingRelations.map(relation => (
                  <div key={relation.id} className="relation-item">
                    <div className="relation-item-icon">
                      <ArrowRightIcon />
                    </div>
                    <div className="relation-item-info">
                      <div className="relation-item-tables">
                        <code className="table-name">{relation.sourceColumn}</code>
                        <span className="relation-item-arrow">→</span>
                        <code className="table-name target">{relation.targetTable}.{relation.targetColumn}</code>
                      </div>
                      {relation.constraintName && (
                        <div className="relation-item-columns">
                          {relation.constraintName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Incoming Relationships */}
          {incomingRelations.length > 0 && (
            <section className="panel-section">
              <div className="panel-section-header">
                <h4 className="panel-section-title">Referenced By</h4>
                <span className="panel-section-badge">{incomingRelations.length}</span>
              </div>
              <div className="relation-list">
                {incomingRelations.map(relation => (
                  <div key={relation.id} className="relation-item incoming">
                    <div className="relation-item-icon">
                      <ArrowLeftIcon />
                    </div>
                    <div className="relation-item-info">
                      <div className="relation-item-tables">
                        <code className="table-name source">{relation.sourceTable}.{relation.sourceColumn}</code>
                        <span className="relation-item-arrow">→</span>
                        <code className="table-name">{relation.targetColumn}</code>
                      </div>
                      {relation.constraintName && (
                        <div className="relation-item-columns">
                          {relation.constraintName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No Relationships */}
          {totalRelations === 0 && (
            <section className="panel-section">
              <div className="panel-empty-state">
                <div className="panel-empty-state-icon">
                  <LinkIcon />
                </div>
                <p className="panel-empty-state-text">
                  No foreign key relationships
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

// Icon Components
const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ColumnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default SidePanel;