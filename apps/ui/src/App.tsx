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
import type { Schema } from '@pg-studio/shared';
import { createLayoutEngine } from '@pg-studio/layout-engine';
import type { LayoutAlgorithm, LayoutResult } from '@pg-studio/layout-engine';
import type { ExportManager } from '@pg-studio/export-manager';
import TableNode from './components/TableNode';
import TopBar from './components/TopBar';
import VisualizerSidebar from './components/VisualizerSidebar';
import { SqlEditor } from './components/SqlEditor';
import { ConnectionModal } from './components/ConnectionModal';
import { SettingsPage } from './components/SettingsPage';
import { TableDetailsPanel } from './components/TableDetailsPanel';
import EdgeWithTooltip from './components/EdgeWithTooltip';
import ExportDialog from './components/ExportDialog';
import DropZone from './components/DropZone';
import Dashboard, { saveRecentProject, type Project } from './components/Dashboard';
import { LoadingOverlay } from './components/LoadingIndicator';
import { ErrorDisplay, type ErrorInfo } from './components/ErrorDisplay';
import { ToastContainer, useToast } from './components/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { useKeyboardShortcuts, createCommonShortcuts } from './hooks/useKeyboardShortcuts';
import { useElectronEvents } from './hooks/useElectronEvents';
import { Onboarding } from './components/Onboarding';
import './styles/themes.css';
import { mockSchema } from './data/mockSchema';

type DataSource = 'db' | 'folder' | 'demo';
type AppView = 'dashboard' | 'visualizer' | 'settings';
type VisualizerMode = 'graph' | 'code';

const nodeTypes = { table: TableNode };
const edgeTypes = { custom: EdgeWithTooltip };

const AppContent = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { toasts, success, error: showError, removeToast } = useToast();
  
  // ReactFlow hooks
  const { setCenter, fitView, zoomIn, zoomOut } = useReactFlow();

  // State
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [viewMode, setViewMode] = useState<VisualizerMode>('graph');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutResult | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
  const [error, setError] = useState<ErrorInfo | null>(null);
  
  // Modals
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Manager
  const exportManager = useMemo(() => {
    return {
      saveLayout: (id: string, layout: any) => {
        localStorage.setItem(`layout-${id}`, JSON.stringify(layout));
      },
      loadLayout: (id: string) => {
        const stored = localStorage.getItem(`layout-${id}`);
        return stored ? JSON.parse(stored) : null;
      }
    } as unknown as ExportManager;
  }, []);

  const handleSave = useCallback(() => {
    if (currentLayout) {
      exportManager.saveLayout('current-project', currentLayout);
      success('Saved', 'Layout saved locally');
    }
  }, [currentLayout, exportManager, success]);

  // Shortcuts
  const shortcuts = useMemo(() => createCommonShortcuts({
    onSave: handleSave,
    onFind: () => document.querySelector<HTMLInputElement>('.sidebar-search input')?.focus(),
    onDelete: () => { if (selectedTables.length > 0) console.log('Delete selected not implemented'); },
    onZoomIn: () => zoomIn(),
    onZoomOut: () => zoomOut(),
    onZoomToFit: () => fitView(),
  }), [selectedTables, handleSave, zoomIn, zoomOut, fitView]);

  useKeyboardShortcuts(shortcuts);

  useElectronEvents({
    onFileOpen: (path) => handleVisualize('folder', path),
  });

  const handleVisualize = useCallback(async (source: DataSource, connection: string) => {
    setIsLoading(true);
    setLoadingMessage('Analyzing schema...');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      let newSchema: Schema = mockSchema;
      if (source === 'demo') {
        newSchema = mockSchema;
        setLoadingMessage('Generating layout...');
      }

      setSchema(newSchema);
      
      const layoutEngine = createLayoutEngine();
      const layoutResult = await layoutEngine.applyLayout(newSchema, {
        algorithm: 'force-directed',
        spacing: { nodeSpacing: 50, layerSpacing: 100, edgeSpacing: 20 }
      });

      setCurrentLayout(layoutResult);

      const newNodes: Node[] = layoutResult.nodes.map(node => ({
        id: node.id,
        type: 'table',
        position: node.position,
        zIndex: 10, // Ensure nodes are above edges
        data: { 
          table: newSchema.tables.find(t => t.id === node.id)!,
          label: node.id
        }
      }));

      const newEdges: Edge[] = layoutResult.edges.map(posEdge => ({
        id: `e-${posEdge.source}-${posEdge.target}`,
        source: posEdge.source,
        target: posEdge.target,
        type: 'smoothstep', // Curved edges that bend around obstacles
        zIndex: 1,
        animated: true,
        style: { 
          stroke: 'var(--accent-primary)', 
          strokeWidth: 2,
          strokeOpacity: 0.6,
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          color: 'var(--accent-primary)',
          width: 20,
          height: 20,
        }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setCurrentView('visualizer');
      
      saveRecentProject({
        id: `proj-${Date.now()}`,
        name: source === 'demo' ? 'Demo Project' : connection.split(/[/\\]/).pop() || 'Project',
        type: source,
        connectionString: source === 'db' ? connection : undefined,
        folderPath: source === 'folder' ? connection : undefined,
        lastOpened: new Date().toISOString(),
        tableCount: newSchema.tables.length
      });

    } catch (err) {
      console.error(err);
      setError({
        title: 'Visualization Failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        details: 'Check console for more details'
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  // Unified table selection with zoom
  const handleSelectTable = useCallback((tableId: string) => {
    setSelectedTables([tableId]);
    setNodes(nds => nds.map(node => ({
      ...node,
      data: { ...node.data, isSelected: node.id === tableId, isDimmed: node.id !== tableId }
    })));
    setDetailsPanelOpen(true);
    
    // Find node position and zoom to it
    const targetNode = nodes.find(n => n.id === tableId);
    if (targetNode) {
      setCenter(targetNode.position.x + 150, targetNode.position.y + 100, { zoom: 1.2, duration: 800 });
    }
  }, [nodes, setCenter]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => { 
    handleSelectTable(node.id);
  }, [handleSelectTable]);
  
  const handlePaneClick = useCallback(() => {
    setSelectedTables([]);
    setDetailsPanelOpen(false);
    setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, isSelected: false, isDimmed: false }
    })));
  }, []);

  const handleShare = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  // Handlers
  const handleOpenProject = useCallback((project: Project) => {
    if (project.type === 'database' && project.connectionString) handleVisualize('db', project.connectionString);
    else if (project.type === 'folder' && project.folderPath) handleVisualize('folder', project.folderPath);
    else if (project.type === 'demo') handleVisualize('demo', 'Demo Data');
  }, [handleVisualize]);

  const handleTriggerImport = useCallback(() => {
    if (window.electron) {
      window.electron.openDialog().then((path: string | null) => { if (path) handleVisualize('folder', path); });
    } else {
      fileInputRef.current?.click();
    }
  }, [handleVisualize]);

  const handleHiddenFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      showError("Browser Limitation", "Cannot scan local paths from browser. Please use Electron app.");
    }
  }, [showError]);

  const handleCreateNew = useCallback((type: 'database' | 'folder' | 'demo') => {
    if (type === 'demo') handleVisualize('demo', 'Demo Data');
    else if (type === 'database') setConnectionModalOpen(true);
    else if (type === 'folder') handleTriggerImport();
  }, [handleVisualize, handleTriggerImport]);

  const handleExecuteQuery = useCallback((query: string) => {
    success('Query sent', 'Query execution is simulated in demo mode.');
  }, [success]);

  const handleAutoLayout = useCallback(async () => {
    if (!schema) return;
    setIsLoading(true);
    const layoutEngine = createLayoutEngine();
    const layoutResult = await layoutEngine.applyLayout(schema, {
       algorithm: 'hierarchical',
       spacing: { nodeSpacing: 60, layerSpacing: 100, edgeSpacing: 20 }
    });
    
    setNodes(layoutResult.nodes.map(node => ({
        id: node.id,
        type: 'table',
        position: node.position,
        data: { table: schema.tables.find(t => t.id === node.id)!, label: node.id }
    })));
    
    setTimeout(() => fitView({ duration: 800 }), 100);
    setIsLoading(false);
  }, [schema, fitView]);

  const handleZoomToFit = useCallback(() => {
    fitView({ duration: 800, padding: 0.2 });
  }, [fitView]);

  if (!user.hasOnboarded) {
    return (
      <div className={`app-root ${theme}`} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Onboarding />
      </div>
    );
  }

  if (currentView === 'settings') {
    return <SettingsPage onClose={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    return (
      <div className={`app-root ${theme}`} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Dashboard 
          onOpenProject={handleOpenProject}
          onCreateNew={handleCreateNew}
          onOpenSettings={() => setCurrentView('settings')}
        />
        {error && <ErrorDisplay error={error} onClose={() => setError(null)} onRetry={() => setError(null)} />}
        {isLoading && <LoadingOverlay message={loadingMessage} progress={loadingProgress} showProgress={false} />}
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleHiddenFileInputChange} />
      </div>
    );
  }

  return (
    <DropZone onFilesDropped={() => {}} disabled={false}>
      <div className={`app-root ${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-app)' }}>
        <ConnectionModal isOpen={connectionModalOpen} onClose={() => setConnectionModalOpen(false)} onConnect={(url) => handleVisualize('db', url)} />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleHiddenFileInputChange} />

        <TopBar 
          onVisualize={handleVisualize} onAutoLayout={handleAutoLayout} onZoomToFit={handleZoomToFit}
          onBackToDashboard={() => setCurrentView('dashboard')} onImport={handleTriggerImport} onSave={handleSave}
          onShare={handleShare}
        />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <VisualizerSidebar 
            tables={schema?.tables || []} selectedTableIds={selectedTables} onSelectTable={handleSelectTable}
            searchQuery={searchQuery} onSearchChange={setSearchQuery} viewMode={viewMode} onViewModeChange={setViewMode}
          />

          <div className="react-flow-wrapper" style={{ flex: 1, position: 'relative', height: '100%' }}>
            {viewMode === 'graph' ? (
              <ReactFlow
                nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                fitView proOptions={{ hideAttribution: true }} style={{ backgroundColor: 'var(--bg-app)' }}
              >
                <MiniMap style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }} />
                <Controls style={{ background: 'var(--bg-card)', padding: '4px', borderRadius: '8px' }} />
                <Background color="var(--border-subtle)" gap={24} size={1} />
              </ReactFlow>
            ) : (
              <SqlEditor schema={schema} selectedTableIds={selectedTables} onExecuteQuery={handleExecuteQuery} />
            )}
            
            {viewMode === 'graph' && detailsPanelOpen && selectedTables.length === 1 && (
              <TableDetailsPanel 
                table={schema?.tables.find(t => t.id === selectedTables[0])!} 
                onClose={() => setDetailsPanelOpen(false)} 
                onViewSql={() => { setViewMode('code'); setDetailsPanelOpen(false); }}
              />
            )}

            {error && <ErrorDisplay error={error} onClose={() => setError(null)} onRetry={() => setError(null)} />}
            {isLoading && <LoadingOverlay message={loadingMessage} progress={loadingProgress} showProgress={false} />}
          </div>
        </div>
        <ExportDialog isOpen={exportDialogOpen} onClose={() => setExportDialogOpen(false)} schema={schema} layout={currentLayout} canvas={canvasRef.current} exportManager={exportManager} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </DropZone>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ReactFlowProvider>
          <AppContent />
        </ReactFlowProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
