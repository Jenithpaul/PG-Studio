import React, { useState, useEffect } from 'react';
import type { Schema, Table } from '@pg-studio/shared';

interface SqlEditorProps {
  schema?: Schema | null;
  selectedTableIds: string[];
  onExecuteQuery?: (query: string) => void;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ schema, selectedTableIds, onExecuteQuery }) => {
  const [editedCode, setEditedCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const selectedTable = schema?.tables.find(t => selectedTableIds.includes(t.id));

  const generateDDL = (table: Table) => {
    let ddl = `-- Schema for: ${table.name}\n\n`;
    ddl += `CREATE TABLE "${table.name}" (\n`;
    const colDefs = table.columns.map(col => {
      let def = `  "${col.name}" ${col.type}`;
      if (!col.isNullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });
    
    const pks = table.columns.filter(c => c.isPrimaryKey).map(c => `"${c.name}"`);
    if (pks.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pks.join(', ')})`);
    }

    ddl += colDefs.join(',\n');
    ddl += '\n);\n';
    return ddl;
  };

  useEffect(() => {
    if (selectedTable) {
      setEditedCode(generateDDL(selectedTable));
      setIsEditing(false);
    }
  }, [selectedTable]);

  const handleExecute = () => {
    if (onExecuteQuery && editedCode.trim()) {
      onExecuteQuery(editedCode);
    }
  };

  if (!schema) {
    return (
      <div className="sql-editor-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <p>No schema loaded</p>
      </div>
    );
  }

  if (!selectedTable) {
    return (
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: 'var(--bg-app)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', marginBottom: '24px', color: 'var(--text-main)', fontSize: '24px' }}>
          Schema Overview
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Select a table from the sidebar to view or edit its SQL definition.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {schema.tables.map(table => (
            <div key={table.id} style={{ 
              padding: '16px', 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>{table.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{table.columns.length} columns</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: 'var(--bg-app)', 
      color: 'var(--text-main)', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{ 
        padding: '12px 20px', 
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedTable.name}.sql
          </h3>
          {isEditing && (
            <span style={{ 
              fontSize: '11px', 
              padding: '2px 8px', 
              backgroundColor: 'rgba(234, 179, 8, 0.2)', 
              color: '#eab308', 
              borderRadius: '4px' 
            }}>
              Modified
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button 
            onClick={handleExecute}
            disabled={!editedCode.trim()}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Execute
          </button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div style={{ flex: 1, padding: '0', overflow: 'hidden', position: 'relative' }}>
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              padding: '20px',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              border: 'none',
              outline: 'none',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'none'
            }}
            spellCheck={false}
          />
        ) : (
          <div style={{ 
            padding: '20px', 
            height: '100%', 
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace', 
            fontSize: '14px', 
            lineHeight: '1.6' 
          }}>
            <pre style={{ margin: 0 }}>
              <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(editedCode || generateDDL(selectedTable)) }} />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

function syntaxHighlight(sql: string): string {
  return sql
    .replace(/(CREATE TABLE|PRIMARY KEY|NOT NULL|DEFAULT|FOREIGN KEY|REFERENCES|ALTER TABLE|ADD CONSTRAINT)/g, '<span style="color: #c678dd;">$1</span>')
    .replace(/(\"[^\"]*\")/g, '<span style="color: #98c379;">$1</span>')
    .replace(/(--.*)/g, '<span style="color: #5c6370; font-style: italic;">$1</span>')
    .replace(/\b(INTEGER|SERIAL|VARCHAR|TEXT|BOOLEAN|TIMESTAMP|DECIMAL|BIGINT|SMALLINT|UUID|DATE|TIME|JSON|JSONB)\b/gi, '<span style="color: #e5c07b;">$1</span>');
}
