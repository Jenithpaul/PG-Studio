import { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { updateManager, setupDataPreservationHandlers, DataPreservation } from './update-manager';

let mainWindow: BrowserWindow | null = null;
let agentProcess: ChildProcess;

// Window state management
interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const defaultWindowState: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false
};

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf-8');
      return { ...defaultWindowState, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return defaultWindowState;
}

function saveWindowState(window: BrowserWindow): void {
  try {
    const bounds = window.getBounds();
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized()
    };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

function createWindow() {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Native window controls
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    show: false, // Don't show until ready
    icon: process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../resources/icon.png')
      : path.join(process.resourcesPath, 'icon.png')
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Save window state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  // Handle window state changes
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:state-changed', { isMaximized: false });
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:state-changed', { isFullScreen: true });
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:state-changed', { isFullScreen: false });
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the UI is copied to the 'ui' folder in resources
    const uiPath = path.join(process.resourcesPath, 'ui', 'index.html');
    console.log('Loading UI from:', uiPath);

    // Check if file exists to help debugging
    if (!fs.existsSync(uiPath)) {
      console.error('UI file not found at:', uiPath);
      // Fallback relative to __dirname (dist) -> ../../ui/dist/index.html (not standard but safe backup)
      // Or standard app bundle path
      const backupPath = path.join(__dirname, '../../ui/dist/index.html');
      if (fs.existsSync(backupPath)) {
        mainWindow.loadFile(backupPath);
      } else {
        const errorHtml = 'data:text/html;charset=utf-8,' + encodeURI('<html><body><h1>Error: Could not load application UI</h1><p>File not found at: ' + uiPath + '</p></body></html>');
        mainWindow.loadURL(errorHtml);
      }
    } else {
      mainWindow.loadFile(uiPath);
    }
  }

  // Set up update manager with main window
  updateManager.setMainWindow(mainWindow);

  // Create application menu with keyboard shortcuts
  createApplicationMenu();
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: isMac ? 'Cmd+O' : 'Ctrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openDirectory'],
              title: 'Select Project Folder'
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu:open-folder', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Open SQL Files...',
          accelerator: isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openFile', 'multiSelections'],
              filters: [{ name: 'SQL Files', extensions: ['sql'] }],
              title: 'Select SQL Files'
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu:open-files', result.filePaths);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export...',
          accelerator: isMac ? 'Cmd+E' : 'Ctrl+E',
          click: () => {
            mainWindow?.webContents.send('menu:export');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const }
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const }
        ])
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Search',
          accelerator: isMac ? 'Cmd+F' : 'Ctrl+F',
          click: () => {
            mainWindow?.webContents.send('menu:search');
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom to Fit',
          accelerator: isMac ? 'Cmd+0' : 'Ctrl+0',
          click: () => {
            mainWindow?.webContents.send('menu:zoom-to-fit');
          }
        },
        {
          label: 'Zoom In',
          accelerator: isMac ? 'Cmd+Plus' : 'Ctrl+Plus',
          click: () => {
            mainWindow?.webContents.send('menu:zoom-in');
          }
        },
        {
          label: 'Zoom Out',
          accelerator: isMac ? 'Cmd+-' : 'Ctrl+-',
          click: () => {
            mainWindow?.webContents.send('menu:zoom-out');
          }
        },
        { type: 'separator' },
        {
          label: 'Auto Layout',
          submenu: [
            {
              label: 'Hierarchical',
              accelerator: isMac ? 'Cmd+1' : 'Ctrl+1',
              click: () => {
                mainWindow?.webContents.send('menu:layout', 'hierarchical');
              }
            },
            {
              label: 'Force Directed',
              accelerator: isMac ? 'Cmd+2' : 'Ctrl+2',
              click: () => {
                mainWindow?.webContents.send('menu:layout', 'force_directed');
              }
            },
            {
              label: 'Grid',
              accelerator: isMac ? 'Cmd+3' : 'Ctrl+3',
              click: () => {
                mainWindow?.webContents.send('menu:layout', 'grid');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Toggle Side Panel',
          accelerator: isMac ? 'Cmd+B' : 'Ctrl+B',
          click: () => {
            mainWindow?.webContents.send('menu:toggle-side-panel');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    },
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: async () => {
            const result = await updateManager.checkForUpdates();
            if (!result.available) {
              dialog.showMessageBox(mainWindow!, {
                type: 'info',
                title: 'No Updates Available',
                message: 'You are running the latest version.',
                detail: `Current version: ${app.getVersion()}`,
                buttons: ['OK']
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/pg-studio/docs');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/pg-studio/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About PG Studio',
              message: 'PG Studio - PostgreSQL Schema Visualizer',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startAgent() {
  const agentPath = path.resolve(__dirname, '../../../agent');

  // Use cross-platform approach for spawning npm
  const isWindows = process.platform === 'win32';
  const npmCommand = isWindows ? 'npm.cmd' : 'npm';

  try {
    agentProcess = spawn(npmCommand, ['run', 'start'], {
      cwd: agentPath,
      stdio: 'pipe',
      // Don't use shell to avoid cmd.exe issues
      shell: false,
      env: { ...process.env }
    });

    agentProcess.stdout?.on('data', (data) => {
      console.log(`Agent stdout: ${data}`);
    });

    agentProcess.stderr?.on('data', (data) => {
      console.error(`Agent stderr: ${data}`);
    });

    agentProcess.on('error', (error) => {
      console.error('Failed to start agent:', error);
      // Try alternative method - run node directly
      const nodeAgentPath = path.resolve(agentPath, 'dist/index.js');
      if (fs.existsSync(nodeAgentPath)) {
        console.log('Trying to start agent with node directly...');
        agentProcess = spawn(process.execPath, [nodeAgentPath], {
          cwd: agentPath,
          stdio: 'pipe',
          env: { ...process.env }
        });
      }
    });
  } catch (error) {
    console.error('Error starting agent:', error);
  }
}

app.whenReady().then(() => {
  // Initialize data preservation handlers
  setupDataPreservationHandlers();
  DataPreservation.ensureDataDirectory();

  startAgent();
  createWindow();

  // Start checking for updates (in production)
  if (process.env.NODE_ENV !== 'development') {
    updateManager.startAutoCheck();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop update checking
  updateManager.stopAutoCheck();

  if (agentProcess) {
    agentProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

ipcMain.handle('dialog:openFolder', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Project Folder',
      buttonLabel: 'Select Folder',
      ...(process.platform === 'darwin' && {
        message: 'Choose a project folder to scan for SQL files'
      })
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    return filePaths[0];
  } catch (error) {
    console.error('Failed to open folder dialog:', error);
    return null;
  }
});

ipcMain.handle('dialog:openFiles', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Select SQL Files',
      buttonLabel: 'Select Files',
      filters: [
        { name: 'SQL Files', extensions: ['sql'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      ...(process.platform === 'darwin' && {
        message: 'Choose SQL files to analyze'
      })
    });

    if (canceled || filePaths.length === 0) {
      return [];
    }

    return filePaths;
  } catch (error) {
    console.error('Failed to open file dialog:', error);
    return [];
  }
});

ipcMain.handle('dialog:saveFile', async (_, options: {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[]
}) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      ...(process.platform === 'darwin' && {
        message: options.title || 'Save file'
      })
    });

    if (canceled || !filePath) {
      return null;
    }

    return filePath;
  } catch (error) {
    console.error('Failed to open save dialog:', error);
    return null;
  }
});

// Drag and drop file handling
ipcMain.handle('files:validateDrop', async (_, filePaths: string[]) => {
  try {
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];

    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.sql') {
        // Verify file exists and is readable
        try {
          await fs.promises.access(filePath, fs.constants.R_OK);
          validFiles.push(filePath);
        } catch {
          invalidFiles.push(filePath);
        }
      } else {
        invalidFiles.push(filePath);
      }
    }

    return { validFiles, invalidFiles };
  } catch (error) {
    console.error('Failed to validate dropped files:', error);
    return { validFiles: [], invalidFiles: filePaths };
  }
});

ipcMain.handle('files:readSqlFile', async (_, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content, path: filePath };
  } catch (error) {
    console.error('Failed to read SQL file:', error);
    return { success: false, error: (error as Error).message, path: filePath };
  }
});

// Window control handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('window:isFullScreen', () => {
  return mainWindow?.isFullScreen() ?? false;
});

// App info handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

ipcMain.handle('app:getTheme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Listen for theme changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
});
