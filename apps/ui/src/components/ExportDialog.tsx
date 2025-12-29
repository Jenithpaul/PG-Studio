import React, { useState, useCallback } from 'react';
import type { Schema } from '@pg-studio/shared';
import type { LayoutResult } from '@pg-studio/layout-engine';
import type { ExportManager, ExportFormat, ExportProgress, ImageExportOptions, SvgExportOptions, SqlExportOptions } from '@pg-studio/export-manager';
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
  canvas,
  exportManager
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; downloadUrl?: string } | null>(null);
  
  // Export options
  const [imageOptions, setImageOptions] = useState<ImageExportOptions>({
    width: 1920,
    height: 1080,
    scale: 2,
    backgroundColor: '#0F0F0F',
    includeBackground: true
  });
  
  const [svgOptions, setSvgOptions] = useState<SvgExportOptions>({
    includeStyles: true,
    embedFonts: false,
    viewBox: { x: 0, y: 0, width: 1920, height: 1080 }
  });
  
  const [sqlOptions, setSqlOptions] = useState<SqlExportOptions>({
    includeConstraints: true,
    includeIndexes: false,
    includeComments: true,
    dialectTarget: 'postgresql'
  });

  const formatOptions = [
    {
      value: 'png' as ExportFormat,
      name: 'PNG Image',
      description: 'High-quality raster image'
    },
    {
      value: 'svg' as ExportFormat,
      name: 'SVG Vector',
      description: 'Scalable vector graphics'
    },
    {
      value: 'json' as ExportFormat,
      name: 'JSON Data',
      description: 'Schema and layout data'
    },
    {
      value: 'sql' as ExportFormat,
      name: 'SQL DDL',
      description: 'CREATE TABLE statements'
    }
  ];

  const handleExport = useCallback(async () => {
    if (!schema || !layout) {
      setExportResult({ success: false, message: 'No schema or layout available' });
      return;
    }

    setProgress({ stage: 'preparing', progress: 0, message: 'Preparing export...' });
    setExportResult(null);

    try {
      let result: Blob | string;
      let filename: string;
      let mimeType: string;

      setProgress({ stage: 'processing', progress: 30, message: 'Processing data...' });

      switch (selectedFormat) {
        case 'png':
          if (!canvas) {
            throw new Error('Canvas not available for PNG export');
          }
          result = await exportManager.exportAsPng(canvas, imageOptions);
          filename = `schema-${Date.now()}.png`;
          mimeType = 'image/png';
          break;

        case 'svg':
          result = await exportManager.exportAsSvg(schema, layout, svgOptions);
          filename = `schema-${Date.now()}.svg`;
          mimeType = 'image/svg+xml';
          break;

        case 'json':
          result = await exportManager.exportAsJson(schema, layout);
          filename = `schema-${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case 'sql':
          result = await exportManager.exportAsSql(schema, sqlOptions);
          filename = `schema-${Date.now()}.sql`;
          mimeType = 'text/sql';
          break;

        default:
          throw new Error(`Unsupported export format: ${selectedFormat}`);
      }

      setProgress({ stage: 'finalizing', progress: 80, message: 'Finalizing export...' });

      // Create download link
      let blob: Blob;
      if (result instanceof Blob) {
        blob = result;
      } else {
        blob = new Blob([result], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress({ stage: 'complete', progress: 100, message: 'Export completed successfully!' });
      setExportResult({ 
        success: true, 
        message: `Successfully exported as ${filename}`,
        downloadUrl: url
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setProgress(null);
        setExportResult(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setProgress({ stage: 'error', progress: 0, message: 'Export failed', error: String(error) });
      setExportResult({ 
        success: false, 
        message: `Export failed: ${error}` 
      });
    }
  }, [schema, layout, canvas, selectedFormat, imageOptions, svgOptions, sqlOptions, exportManager, onClose]);

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
          <label className="export-format-label">Export Format</label>
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
                  <div className="export-format-name">{option.name}</div>
                  <div className="export-format-desc">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format-specific Options */}
        {selectedFormat === 'png' && (
          <div className="export-options-section">
            <label className="export-format-label">PNG Options</label>
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
              <div className="export-option-group">
                <label className="export-option-checkbox">
                  <input
                    type="checkbox"
                    checked={imageOptions.includeBackground}
                    onChange={e => setImageOptions(prev => ({ ...prev, includeBackground: e.target.checked }))}
                  />
                  Include background
                </label>
              </div>
            </div>
          </div>
        )}

        {selectedFormat === 'sql' && (
          <div className="export-options-section">
            <label className="export-format-label">SQL Options</label>
            <div className="export-options-grid">
              <div className="export-option-group">
                <label className="export-option-checkbox">
                  <input
                    type="checkbox"
                    checked={sqlOptions.includeConstraints}
                    onChange={e => setSqlOptions(prev => ({ ...prev, includeConstraints: e.target.checked }))}
                  />
                  Include foreign key constraints
                </label>
              </div>
              <div className="export-option-group">
                <label className="export-option-checkbox">
                  <input
                    type="checkbox"
                    checked={sqlOptions.includeComments}
                    onChange={e => setSqlOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                  />
                  Include comments
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="export-progress">
            <div className="export-progress-bar">
              <div 
                className="export-progress-fill" 
                style={{ width: `${progress.progress}%` }}
              />
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
          <button 
            className="export-dialog-btn cancel" 
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button 
            className="export-dialog-btn export" 
            onClick={handleExport}
            disabled={!canExport}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;