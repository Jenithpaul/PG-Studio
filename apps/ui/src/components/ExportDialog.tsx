import React, { useState, useCallback } from 'react';
import type { Schema } from '@pg-studio/shared';
import type { LayoutResult } from '@pg-studio/layout-engine';
import type { ExportManager, ExportFormat, ExportProgress } from '@pg-studio/export-manager';
import { toPng, toSvg } from 'html-to-image';
import './ExportDialog.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schema: Schema | null;
  layout: LayoutResult | null;
  canvas: HTMLCanvasElement | null;
  exportManager: ExportManager;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  schema,
  layout,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Export options
  const [imageOptions, setImageOptions] = useState({
    width: 1920,
    height: 1080,
    scale: 2,
    includeBackground: true
  });
  
  const [sqlOptions, setSqlOptions] = useState({
    includeConstraints: true,
    includeComments: true,
  });

  const formatOptions = [
    { value: 'png' as ExportFormat, name: 'PNG Image', description: 'High-quality raster image', icon: '🖼️' },
    { value: 'svg' as ExportFormat, name: 'SVG Vector', description: 'Scalable vector graphics', icon: '📐' },
    { value: 'json' as ExportFormat, name: 'JSON Data', description: 'Schema and layout data', icon: '📄' },
    { value: 'sql' as ExportFormat, name: 'SQL DDL', description: 'CREATE TABLE statements', icon: '🗃️' }
  ];

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSql = (schema: Schema): string => {
    let sql = `-- PostgreSQL Schema Export\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    for (const table of schema.tables) {
      sql += `CREATE TABLE "${table.name}" (\n`;
      
      const columnDefs = table.columns.map(col => {
        let def = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPrimaryKey) def += ' PRIMARY KEY';
        if (!col.isNullable && !col.isPrimaryKey) def += ' NOT NULL';
        return def;
      });
      
      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
      
      // Foreign keys from relations
      if (sqlOptions.includeConstraints && schema.relations) {
        const tableRelations = schema.relations.filter(r => r.sourceTable === table.id);
        for (const rel of tableRelations) {
          sql += `ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${rel.sourceColumn}" `;
          sql += `FOREIGN KEY ("${rel.sourceColumn}") REFERENCES "${rel.targetTable}"("${rel.targetColumn}");\n`;
        }
        if (tableRelations.length > 0) sql += '\n';
      }
    }
    
    return sql;
  };

  const generateJson = (schema: Schema, layout: LayoutResult): string => {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      schema: {
        tables: schema.tables,
        relations: schema.relations
      },
      layout: {
        nodes: layout.nodes,
        edges: layout.edges,
        bounds: layout.bounds
      }
    }, null, 2);
  };

  const handleExport = useCallback(async () => {
    if (!schema || !layout) {
      setExportResult({ success: false, message: 'No schema or layout available' });
      return;
    }

    setProgress({ stage: 'preparing', progress: 0, message: 'Preparing export...' });
    setExportResult(null);

    try {
      const timestamp = Date.now();
      setProgress({ stage: 'processing', progress: 30, message: 'Processing data...' });
      
      await new Promise(r => setTimeout(r, 300)); // Brief delay for UX

      switch (selectedFormat) {
        case 'png': {
          setProgress({ stage: 'processing', progress: 50, message: 'Capturing diagram...' });
          const flowWrapper = document.querySelector('.react-flow-wrapper');
          if (flowWrapper) {
            const dataUrl = await toPng(flowWrapper as HTMLElement, {
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim() || '#0f0f0f',
              pixelRatio: imageOptions.scale,
              width: imageOptions.width,
              height: imageOptions.height,
            });
            const link = document.createElement('a');
            link.download = `schema-${timestamp}.png`;
            link.href = dataUrl;
            link.click();
          } else {
            throw new Error('Diagram container not found');
          }
          break;
        }

        case 'svg': {
          setProgress({ stage: 'processing', progress: 50, message: 'Generating SVG...' });
          const flowWrapper = document.querySelector('.react-flow-wrapper');
          if (flowWrapper) {
            const svgData = await toSvg(flowWrapper as HTMLElement, {
              backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim() || '#0f0f0f',
            });
            const link = document.createElement('a');
            link.download = `schema-${timestamp}.svg`;
            link.href = svgData;
            link.click();
          } else {
            throw new Error('Diagram container not found');
          }
          break;
        }

        case 'json': {
          const jsonContent = generateJson(schema, layout);
          downloadFile(jsonContent, `schema-${timestamp}.json`, 'application/json');
          break;
        }

        case 'sql': {
          const sqlContent = generateSql(schema);
          downloadFile(sqlContent, `schema-${timestamp}.sql`, 'text/sql');
          break;
        }
      }

      setProgress({ stage: 'complete', progress: 100, message: 'Export completed!' });
      setExportResult({ success: true, message: `Successfully exported as ${selectedFormat.toUpperCase()}` });

      setTimeout(() => {
        onClose();
        setProgress(null);
        setExportResult(null);
      }, 1500);

    } catch (error) {
      console.error('Export failed:', error);
      setProgress({ stage: 'error', progress: 0, message: 'Export failed' });
      setExportResult({ success: false, message: `Export failed: ${error}` });
    }
  }, [schema, layout, selectedFormat, imageOptions, sqlOptions, onClose]);

  const handleClose = useCallback(() => {
    setProgress(null);
    setExportResult(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const isExporting = progress && progress.stage !== 'complete' && progress.stage !== 'error';
  const canExport = schema && layout && !isExporting;

  return (
    <div className="export-dialog-overlay" onClick={handleClose}>
      <div className="export-dialog" onClick={e => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h2 className="export-dialog-title">Export Schema</h2>
          <button className="export-dialog-close" onClick={handleClose}>×</button>
        </div>

        {/* Format Selection */}
        <div className="export-format-section">
          <label className="export-format-label">Choose Format</label>
          <div className="export-format-options">
            {formatOptions.map(option => (
              <label 
                key={option.value}
                className={`export-format-option ${selectedFormat === option.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={e => setSelectedFormat(e.target.value as ExportFormat)}
                />
                <div className="export-format-info">
                  <div className="export-format-name">{option.icon} {option.name}</div>
                  <div className="export-format-desc">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* PNG Options */}
        {selectedFormat === 'png' && (
          <div className="export-options-section">
            <label className="export-format-label">Image Options</label>
            <div className="export-options-grid">
              <div className="export-option-group">
                <label className="export-option-label">Width (px)</label>
                <input
                  type="number"
                  className="export-option-input"
                  value={imageOptions.width}
                  onChange={e => setImageOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 1920 }))}
                />
              </div>
              <div className="export-option-group">
                <label className="export-option-label">Height (px)</label>
                <input
                  type="number"
                  className="export-option-input"
                  value={imageOptions.height}
                  onChange={e => setImageOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 1080 }))}
                />
              </div>
              <div className="export-option-group">
                <label className="export-option-label">Scale</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4"
                  className="export-option-input"
                  value={imageOptions.scale}
                  onChange={e => setImageOptions(prev => ({ ...prev, scale: parseFloat(e.target.value) || 2 }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* SQL Options */}
        {selectedFormat === 'sql' && (
          <div className="export-options-section">
            <label className="export-format-label">SQL Options</label>
            <div className="export-options-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label className="export-option-checkbox">
                <input
                  type="checkbox"
                  checked={sqlOptions.includeConstraints}
                  onChange={e => setSqlOptions(prev => ({ ...prev, includeConstraints: e.target.checked }))}
                />
                Include foreign key constraints
              </label>
              <label className="export-option-checkbox">
                <input
                  type="checkbox"
                  checked={sqlOptions.includeComments}
                  onChange={e => setSqlOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                />
                Include table comments
              </label>
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="export-progress">
            <div className="export-progress-bar">
              <div className="export-progress-fill" style={{ width: `${progress.progress}%` }} />
            </div>
            <div className="export-progress-text">{progress.message}</div>
          </div>
        )}

        {/* Result Messages */}
        {exportResult && (
          <div className={exportResult.success ? 'export-success' : 'export-error'}>
            {exportResult.success ? '✓' : '✗'} {exportResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="export-dialog-actions">
          <button className="export-dialog-btn cancel" onClick={handleClose} disabled={isExporting}>
            Cancel
          </button>
          <button className="export-dialog-btn export" onClick={handleExport} disabled={!canExport}>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;