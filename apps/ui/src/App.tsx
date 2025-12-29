import { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import type { Schema, Table } from '@pg-studio/shared';
import { createLayoutEngine } from '@pg-studio/layout-engine';
import type { LayoutAlgorithm, LayoutResult } from '@pg-studio/layout-engine';
import type { ExportManager } from '@pg-studio/export-manager';
import TableNode from './components/TableNode';
import TopBar from './components/TopBar';
import SearchBar, { type FilterOptions } from './components/SearchBar';
import SidePanel from './components/SidePanel';
import EdgeWithTooltip from './components/EdgeWithTooltip';
import ExportDialog from './components/ExportDialog';
import DropZone from './components/DropZone';
import Dashboard, { saveRecentProject, type Project } from './components/Dashboard';
import { LoadingOverlay } from './components/LoadingIndicator';
import { ErrorDisplay, type ErrorInfo } from './components/ErrorDisplay';
import { ToastContainer, useToast } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { useKeyboardShortcuts, createCommonShortcuts } from './hooks/useKeyboardShortcuts';
import { useElectronEvents } from './hooks/useElectronEvents';
import './styles/themes.css';
import { mockSchema } from './data/mockSchema';

type DataSource = 'db' | 'folder' | 'demo';
type AppView = 'dashboard' | 'visualizer';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Create a single layout engine instance
const layoutEngine = createLayoutEngine({
  nodeSize: { width: 250, height: 150 },
  spacing: { nodeSpacing: 100, layerSpacing: 150, edgeSpacing: 20 },
});

// Create export manager instance - using html-to-image for DOM capture
const exportManager: ExportManager = {
  async exportAsPng(_canvas, options) {
    // Import html-to-image dynamically
    const { toPng } = await import('html-to-image');
    
    // Find the ReactFlow viewport element
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) {
      throw new Error('ReactFlow element not found');
    }
    
    try {
      const dataUrl = await toPng(flowElement, {
        backgroundColor: options.includeBackground ? options.backgroundColor : undefined,
        width: options.width,
        height: options.height,
        pixelRatio: options.scale,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('PNG export failed:', error);
      throw error;
    }
  },

  async exportAsSvg(schema, layout, options) {
    const { viewBox } = options;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">`;
    
    for (const node of layout.nodes) {
      const table = schema.tables.find(t => t.id === node.id);
      if (table) {
        svg += `<rect x="${node.position.x}" y="${node.position.y}" width="${node.size.width}" height="${node.size.height}" fill="white" stroke="black"/>`;
        svg += `<text x="${node.position.x + 10}" y="${node.position.y + 20}" font-family="Arial" font-size="14">${table.name}</text>`;
      }
    }
    
    svg += '</svg>';
    return svg;
  },

  async exportAsJson(schema, layout) {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      schema,
      layout
    };
    return JSON.stringify(exportData, null, 2);
  },

  async exportAsSql(schema, _options) {
    let sql = `-- PostgreSQL Schema Export\n-- Generated on ${new Date().toISOString()}\n\n`;
    
    for (const table of schema.tables) {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const columnSql = table.columns.map(column => {
        let colSql = `  "${column.name}" ${column.type}`;
        if (!column.isNullable) {
          colSql += ' NOT NULL';
        }
        return colSql;
      });
      
      const primaryKeys = table.columns.filter(c => c.isPrimaryKey);
      if (primaryKeys.length > 0) {
        const pkColumns = primaryKeys.map(c => `"${c.name}"`).join(', ');
        columnSql.push(`  PRIMARY KEY (${pkColumns})`);
      }
      
      sql += columnSql.join(',\n');
      sql += '\n);\n\n';
    }
    
    return sql;
  },

  async saveLayout(projectPath, layout) {
    if (typeof localStorage !== 'undefined') {
      const key = `pg-studio-layout-${projectPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(key, JSON.stringify({ projectPath, layout, savedAt: new Date().toISOString() }));
    }
  },

  async loadLayout(projectPath) {
    if (typeof localStorage !== 'undefined') {
      const key = `pg-studio-layout-${projectPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const layoutData = JSON.parse(stored);
        return layoutData.layout;
      }
    }
    return null;
  },

  async autoSaveLayout(projectPath, layout) {
    return this.saveLayout(projectPath, layout);
  },

  setAutoSave(_enabled, _delayMs) {
    // No-op for simplified implementation
  },

  getProjectState() {
    return { currentPath: null, recentProjects: [], bookmarks: [] };
  },

  getRecentProjects() {
    return [];
  },

  getBookmarks() {
    return [];
  },

  setCurrentProject(_path) {
    // No-op for simplified implementation
  },

  getCurrentProject() {
    return null;
  },

  addBookmark(_path, _name, _description) {
    // No-op for simplified implementation
  },

  removeBookmark(_path) {
    // No-op for simplified implementation
  },

  clearRecentProjects() {
    // No-op for simplified implementation
  },

  removeFromRecent(_path) {
    // No-op for simplified implementation
  }
};

function FlowCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [error, setError] = useState<ErrorInfo | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(false);
  const [selectedTableForPanel, setSelectedTableForPanel] = useState<Table | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showTables: true,
    showViews: true,
    showRelations: true,
  });
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Search and filter logic
  const { matchingTableIds } = useMemo(() => {
    if (!schema) return { filteredTables: [], matchingTableIds: new Set<string>() };

    let tables = schema.tables;
    
    const matching = new Set<string>();
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tables = tables.filter(table => {
        const matches = table.name.toLowerCase().includes(query) ||
                       table.columns.some(col => col.name.toLowerCase().includes(query));
        if (matches) {
          matching.add(table.id);
        }
        return matches;
      });
    } else {
      tables.forEach(table => matching.add(table.id));
    }

    return { filteredTables: tables, matchingTableIds: matching };
  }, [schema, searchQuery, filterOptions]);

  // Focus search input
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  // Handle zoom operations
  const handleZoomToFit = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  // Handle export
  const handleExport = useCallback(() => {
    if (schema && schema.tables.length > 0) {
      setExportDialogOpen(true);
    }
  }, [schema]);

  const handleCloseExportDialog = useCallback(() => {
    setExportDialogOpen(false);
  }, []);

  // Handle layout changes
  const handleAutoLayout = useCallback((algorithm: LayoutAlgorithm) => {
    if (!schema) return;
    const layoutResult = layoutEngine.applyLayout(schema, { algorithm });
    applyLayoutToNodes(layoutResult, schema);
  }, [schema]);

  // Handle side panel toggle
  const handleToggleSidePanel = useCallback(() => {
    setSidePanelOpen(prev => !prev);
  }, []);

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (exportDialogOpen) {
      setExportDialogOpen(false);
    } else if (sidePanelOpen) {
      setSidePanelOpen(false);
      setSelectedTableForPanel(null);
    } else if (searchQuery) {
      setSearchQuery('');
    }
  }, [exportDialogOpen, sidePanelOpen, searchQuery]);

  // Handle folder open from menu
  const handleMenuOpenFolder = useCallback(async (folderPath: string) => {
    await handleVisualize('folder', folderPath);
  }, []);

  // Handle files open from menu
  const handleMenuOpenFiles = useCallback(async (filePaths: string[]) => {
    if (filePaths.length > 0) {
      // For now, use the directory of the first file
      const firstFile = filePaths[0];
      const folderPath = firstFile.substring(0, firstFile.lastIndexOf('/') || firstFile.lastIndexOf('\\'));
      await handleVisualize('folder', folderPath);
    }
  }, []);

  // Handle layout from menu
  const handleMenuLayout = useCallback((algorithm: string) => {
    if (algorithm === 'hierarchical' || algorithm === 'force_directed' || algorithm === 'grid') {
      handleAutoLayout(algorithm as LayoutAlgorithm);
    }
  }, [handleAutoLayout]);

  // Set up keyboard shortcuts
  const shortcuts = useMemo(() => createCommonShortcuts({
    onSearch: focusSearch,
    onExport: handleExport,
    onZoomToFit: handleZoomToFit,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onLayoutHierarchical: () => handleAutoLayout('hierarchical'),
    onLayoutForceDirected: () => handleAutoLayout('force_directed'),
    onLayoutGrid: () => handleAutoLayout('grid'),
    onToggleSidePanel: handleToggleSidePanel,
    onEscape: handleEscape,
  }), [focusSearch, handleExport, handleZoomToFit, handleZoomIn, handleZoomOut, handleAutoLayout, handleToggleSidePanel, handleEscape]);

  useKeyboardShortcuts({ shortcuts, enabled: true });

  // Set up Electron menu event handlers
  useElectronEvents({
    onOpenFolder: handleMenuOpenFolder,
    onOpenFiles: handleMenuOpenFiles,
    onExport: handleExport,
    onSearch: focusSearch,
    onZoomToFit: handleZoomToFit,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onLayout: handleMenuLayout,
    onToggleSidePanel: handleToggleSidePanel,
  });

  const nodeTypes = useMemo(() => ({ table: TableNode }), []);
  const edgeTypes = useMemo(() => ({ default: EdgeWithTooltip }), []);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const applyLayoutToNodes = useCallback((layoutResult: LayoutResult, currentSchema: Schema) => {
    setCurrentLayout(layoutResult);
    
    const newNodes: Node[] = layoutResult.nodes.map(posNode => {
      const table = currentSchema.tables.find(t => t.id === posNode.id);
      const isHighlighted = matchingTableIds.has(posNode.id) && searchQuery.trim() !== '';
      const isDimmed = searchQuery.trim() !== '' && !matchingTableIds.has(posNode.id);
      const isSelected = selectedTables.includes(posNode.id);
      
      return {
        id: posNode.id,
        type: 'table',
        data: { 
          label: table?.name || posNode.id, 
          table: table,
          isHighlighted,
          isDimmed,
          isSelected,
          searchQuery: searchQuery.trim(),
        },
        position: posNode.position,
      };
    });

    const newEdges: Edge[] = layoutResult.edges.map(posEdge => {
      const isRelationVisible = filterOptions.showRelations;
      const sourceMatches = matchingTableIds.has(posEdge.source);
      const targetMatches = matchingTableIds.has(posEdge.target);
      const shouldHighlight = searchQuery.trim() !== '' && (sourceMatches || targetMatches);
      const shouldDim = searchQuery.trim() !== '' && !sourceMatches && !targetMatches;

      const relation = currentSchema.relations.find(rel => 
        rel.sourceTable === posEdge.source && rel.targetTable === posEdge.target
      );

      return {
        id: posEdge.id,
        source: posEdge.source,
        target: posEdge.target,
        sourceHandle: posEdge.sourceHandle,
        targetHandle: posEdge.targetHandle,
        type: 'default',
        animated: shouldHighlight,
        hidden: !isRelationVisible,
        data: relation ? { relation } : undefined,
        style: { 
          stroke: shouldHighlight ? '#4CAF50' : shouldDim ? '#ccc' : '#555',
          strokeWidth: shouldHighlight ? 2 : 1,
          opacity: shouldDim ? 0.3 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: shouldHighlight ? '#4CAF50' : shouldDim ? '#ccc' : '#555',
        },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
      
      setTimeout(() => {
        const reactFlowElement = document.querySelector('.react-flow__viewport');
        if (reactFlowElement) {
          const canvas = document.createElement('canvas');
          const rect = reactFlowElement.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          canvasRef.current = canvas;
        }
      }, 100);
    }, 50);
  }, [reactFlowInstance, matchingTableIds, searchQuery, selectedTables, filterOptions.showRelations]);

  const handleVisualize = useCallback(async (source: DataSource, value: string) => {
    setError(null);
    setNodes([]);
    setEdges([]);
    setSchema(null);
    setSearchQuery('');
    setSelectedTables([]);
    setSidePanelOpen(false);
    setSelectedTableForPanel(null);
    
    // Set loading state with appropriate message
    setIsLoading(true);
    setLoadingProgress(undefined);
    setLoadingMessage(source === 'db' 
      ? 'Connecting to database...' 
      : 'Scanning project folder...'
    );

    if (source === 'demo') {
      setLoadingMessage('Loading demo data...');
      setLoadingProgress(0.5);
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        setSchema(mockSchema as unknown as Schema); // Cast to handle potential minor type mismatches if any remain
        const layoutResult = layoutEngine.applyHierarchicalLayout(mockSchema as unknown as Schema);
        applyLayoutToNodes(layoutResult, mockSchema as unknown as Schema);
        
        setLoadingProgress(1);
        setIsLoading(false);
        success('Demo data loaded', 'Loaded sample e-commerce schema');
      }, 500);
      return;
    }

    try {
      const endpoint = source === 'db' ? '/api/schema/db' : '/api/schema/project';
      const body = source === 'db' ? { connectionString: value } : { projectPath: value };

      // Update loading message for fetch
      setLoadingMessage(source === 'db' 
        ? 'Fetching schema from database...' 
        : 'Parsing SQL files...'
      );
      setLoadingProgress(0.3);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        // Handle structured error response
        if (err.userMessage) {
          throw err as ErrorInfo;
        }
        throw new Error(err.error || `HTTP error! status: ${response.status}`);
      }

      setLoadingMessage('Processing schema...');
      setLoadingProgress(0.6);

      const fetchedSchema: Schema = await response.json();
      setSchema(fetchedSchema);

      setLoadingMessage('Generating layout...');
      setLoadingProgress(0.8);

      const layoutResult = layoutEngine.applyHierarchicalLayout(fetchedSchema);
      applyLayoutToNodes(layoutResult, fetchedSchema);

      setLoadingProgress(1);
      
      // Show success toast
      success(
        'Schema loaded successfully',
        `Found ${fetchedSchema.tables.length} tables and ${fetchedSchema.relations.length} relationships`
      );

    } catch (e: any) {
      // Handle both structured errors and plain errors
      if (e.userMessage) {
        setError(e as ErrorInfo);
        showError(e.userMessage, undefined, e.suggestedActions?.slice(0, 2));
      } else {
        const errorMessage = e.message || 'An unknown error occurred';
        setError(errorMessage);
        showError('Operation failed', errorMessage);
      }
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingProgress(undefined);
    }
  }, [applyLayoutToNodes, success, showError]);

  // Handle dropped SQL files
  const handleFilesDropped = useCallback(async (filePaths: string[]) => {
    if (filePaths.length === 0) return;
    
    // Get the directory of the first file to use as the folder path
    const firstFile = filePaths[0];
    const separatorIndex = Math.max(firstFile.lastIndexOf('/'), firstFile.lastIndexOf('\\'));
    const folderPath = separatorIndex > 0 ? firstFile.substring(0, separatorIndex) : firstFile;
    
    await handleVisualize('folder', folderPath);
  }, [handleVisualize]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const table = schema?.tables.find(t => t.id === node.id);
    if (table) {
      setSelectedTableForPanel(table);
      setSidePanelOpen(true);
    }
    
    setSelectedTables(prev => {
      if (prev.includes(node.id)) {
        return prev.filter(id => id !== node.id);
      } else {
        return [...prev, node.id];
      }
    });
  }, [schema]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((options: FilterOptions) => {
    setFilterOptions(options);
  }, []);

  const handleCloseSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    setSelectedTableForPanel(null);
  }, []);

  // Dashboard handlers
  const handleOpenProject = useCallback((project: Project) => {
    if (project.type === 'database' && project.connectionString) {
      handleVisualize('db', project.connectionString);
    } else if (project.type === 'folder' && project.folderPath) {
      handleVisualize('folder', project.folderPath);
    } else if (project.type === 'demo') {
      handleVisualize('demo', 'Demo Data');
    }
    setCurrentView('visualizer');
  }, [handleVisualize]);

  const handleCreateNew = useCallback((type: 'database' | 'folder' | 'demo') => {
    if (type === 'demo') {
      handleVisualize('demo', 'Demo Data');
      setCurrentView('visualizer');
    } else if (type === 'database') {
      // Switch to visualizer with default connection string
      setCurrentView('visualizer');
    } else if (type === 'folder') {
      // Open folder dialog if in Electron
      if (window.electron) {
        window.electron.openDialog().then((path: string | null) => {
          if (path) {
            handleVisualize('folder', path);
            setCurrentView('visualizer');
          }
        });
      } else {
        setCurrentView('visualizer');
      }
    }
  }, [handleVisualize]);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  // Show Dashboard or Visualizer based on currentView
  if (currentView === 'dashboard') {
    return (
      <Dashboard
        onOpenProject={handleOpenProject}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <DropZone onFilesDropped={handleFilesDropped} disabled={false}>
      <div className="app-container">
        <TopBar 
          onVisualize={(source: DataSource, value: string) => {
            handleVisualize(source, value);
            // Save to recent projects
            if (source === 'db') {
              saveRecentProject({
                id: `db-${Date.now()}`,
                name: value.split('/').pop() || 'Database',
                type: 'database',
                connectionString: value,
                lastOpened: new Date().toISOString(),
                tableCount: schema?.tables.length
              });
            } else if (source === 'folder') {
              saveRecentProject({
                id: `folder-${Date.now()}`,
                name: value.split(/[/\\]/).pop() || 'Project',
                type: 'folder',
                folderPath: value,
                lastOpened: new Date().toISOString(),
                tableCount: schema?.tables.length
              });
            }
          }} 
          onAutoLayout={handleAutoLayout}
          onZoomToFit={handleZoomToFit}
          onExport={handleExport}
          hasSchema={schema !== null && schema.tables.length > 0}
          onBackToDashboard={handleBackToDashboard}
        />
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          disabled={!schema || schema.tables.length === 0}
          tableCount={schema?.tables.length || 0}
          matchCount={matchingTableIds.size}
        />
        {error && (
          <ErrorDisplay
            error={error}
            onClose={() => setError(null)}
            onRetry={() => {
              setError(null);
              // Could trigger a retry here if we stored the last operation
            }}
          />
        )}
        {isLoading && (
          <LoadingOverlay
            message={loadingMessage}
            progress={loadingProgress}
            showProgress={loadingProgress !== undefined}
          />
        )}
        <div className="react-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <SidePanel
          isOpen={sidePanelOpen}
          onClose={handleCloseSidePanel}
          selectedTable={selectedTableForPanel}
          schema={schema}
        />
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={handleCloseExportDialog}
          schema={schema}
          layout={currentLayout}
          canvas={canvasRef.current}
          exportManager={exportManager}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </DropZone>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default App;
