import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for better typing
interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl?: string;
}

interface ElectronAPI {
  // Dialog handlers
  openDialog: () => Promise<string | null>;
  openFiles: () => Promise<string[]>;
  saveFile: (options?: { 
    title?: string; 
    defaultPath?: string; 
    filters?: { name: string; extensions: string[] }[] 
  }) => Promise<string | null>;
  
  // Drag and drop handlers
  validateDrop: (filePaths: string[]) => Promise<{ validFiles: string[]; invalidFiles: string[] }>;
  readSqlFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string; path: string }>;
  
  // Window control handlers
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  isFullScreen: () => Promise<boolean>;
  
  // App info handlers
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getTheme: () => Promise<'dark' | 'light'>;
  
  // Update handlers
  checkForUpdates: () => Promise<{ available: boolean; info?: UpdateInfo; error?: string }>;
  getUpdateInfo: () => Promise<UpdateInfo | null>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  dismissUpdate: () => Promise<boolean>;
  
  // Data preservation handlers
  backupData: () => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  restoreData: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
  saveProjectState: (projectPath: string, state: object) => Promise<{ success: boolean }>;
  loadProjectState: (projectPath: string) => Promise<object | null>;
  getRecentProjects: () => Promise<string[]>;
  addRecentProject: (projectPath: string) => Promise<{ success: boolean }>;
  clearRecentProjects: () => Promise<{ success: boolean }>;
  
  // Event listeners
  onWindowStateChanged: (callback: (state: { isMaximized?: boolean; isFullScreen?: boolean }) => void) => () => void;
  onThemeChanged: (callback: (theme: 'dark' | 'light') => void) => () => void;
  onMenuOpenFolder: (callback: (folderPath: string) => void) => () => void;
  onMenuOpenFiles: (callback: (filePaths: string[]) => void) => () => void;
  onMenuExport: (callback: () => void) => () => void;
  onMenuSearch: (callback: () => void) => () => void;
  onMenuZoomToFit: (callback: () => void) => () => void;
  onMenuZoomIn: (callback: () => void) => () => void;
  onMenuZoomOut: (callback: () => void) => () => void;
  onMenuLayout: (callback: (algorithm: string) => void) => () => void;
  onMenuToggleSidePanel: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateDownloadProgress: (callback: (progress: { percent: number }) => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
}

contextBridge.exposeInMainWorld('electron', {
  // Dialog handlers
  openDialog: async (): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke('dialog:openFolder');
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
      return null;
    }
  },
  
  openFiles: async (): Promise<string[]> => {
    try {
      return await ipcRenderer.invoke('dialog:openFiles');
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return [];
    }
  },
  
  saveFile: async (options?: { 
    title?: string; 
    defaultPath?: string; 
    filters?: { name: string; extensions: string[] }[] 
  }): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke('dialog:saveFile', options);
    } catch (error) {
      console.error('Failed to open save dialog:', error);
      return null;
    }
  },
  
  // Drag and drop handlers
  validateDrop: async (filePaths: string[]): Promise<{ validFiles: string[]; invalidFiles: string[] }> => {
    try {
      return await ipcRenderer.invoke('files:validateDrop', filePaths);
    } catch (error) {
      console.error('Failed to validate dropped files:', error);
      return { validFiles: [], invalidFiles: filePaths };
    }
  },
  
  readSqlFile: async (filePath: string): Promise<{ success: boolean; content?: string; error?: string; path: string }> => {
    try {
      return await ipcRenderer.invoke('files:readSqlFile', filePath);
    } catch (error) {
      console.error('Failed to read SQL file:', error);
      return { success: false, error: (error as Error).message, path: filePath };
    }
  },
  
  // Window control handlers
  minimizeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke('window:minimize');
  },
  
  maximizeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke('window:maximize');
  },
  
  closeWindow: async (): Promise<void> => {
    await ipcRenderer.invoke('window:close');
  },
  
  isMaximized: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('window:isMaximized');
  },
  
  isFullScreen: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('window:isFullScreen');
  },
  
  // App info handlers
  getVersion: async (): Promise<string> => {
    return await ipcRenderer.invoke('app:getVersion');
  },
  
  getPlatform: async (): Promise<string> => {
    return await ipcRenderer.invoke('app:getPlatform');
  },
  
  getTheme: async (): Promise<'dark' | 'light'> => {
    return await ipcRenderer.invoke('app:getTheme');
  },
  
  // Update handlers
  checkForUpdates: async () => {
    return await ipcRenderer.invoke('update:check');
  },
  
  getUpdateInfo: async () => {
    return await ipcRenderer.invoke('update:getInfo');
  },
  
  downloadUpdate: async () => {
    return await ipcRenderer.invoke('update:download');
  },
  
  installUpdate: async () => {
    return await ipcRenderer.invoke('update:install');
  },
  
  dismissUpdate: async () => {
    return await ipcRenderer.invoke('update:dismiss');
  },
  
  // Data preservation handlers
  backupData: async () => {
    return await ipcRenderer.invoke('data:backup');
  },
  
  restoreData: async (backupPath: string) => {
    return await ipcRenderer.invoke('data:restore', backupPath);
  },
  
  saveProjectState: async (projectPath: string, state: object) => {
    return await ipcRenderer.invoke('data:saveProjectState', projectPath, state);
  },
  
  loadProjectState: async (projectPath: string) => {
    return await ipcRenderer.invoke('data:loadProjectState', projectPath);
  },
  
  getRecentProjects: async () => {
    return await ipcRenderer.invoke('data:getRecentProjects');
  },
  
  addRecentProject: async (projectPath: string) => {
    return await ipcRenderer.invoke('data:addRecentProject', projectPath);
  },
  
  clearRecentProjects: async () => {
    return await ipcRenderer.invoke('data:clearRecentProjects');
  },
  
  // Event listeners with cleanup functions
  onWindowStateChanged: (callback: (state: { isMaximized?: boolean; isFullScreen?: boolean }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { isMaximized?: boolean; isFullScreen?: boolean }) => {
      callback(state);
    };
    ipcRenderer.on('window:state-changed', handler);
    return () => {
      ipcRenderer.removeListener('window:state-changed', handler);
    };
  },
  
  onThemeChanged: (callback: (theme: 'dark' | 'light') => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => {
      callback(theme);
    };
    ipcRenderer.on('theme:changed', handler);
    return () => {
      ipcRenderer.removeListener('theme:changed', handler);
    };
  },
  
  onMenuOpenFolder: (callback: (folderPath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, folderPath: string) => {
      callback(folderPath);
    };
    ipcRenderer.on('menu:open-folder', handler);
    return () => {
      ipcRenderer.removeListener('menu:open-folder', handler);
    };
  },
  
  onMenuOpenFiles: (callback: (filePaths: string[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePaths: string[]) => {
      callback(filePaths);
    };
    ipcRenderer.on('menu:open-files', handler);
    return () => {
      ipcRenderer.removeListener('menu:open-files', handler);
    };
  },
  
  onMenuExport: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:export', handler);
    return () => {
      ipcRenderer.removeListener('menu:export', handler);
    };
  },
  
  onMenuSearch: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:search', handler);
    return () => {
      ipcRenderer.removeListener('menu:search', handler);
    };
  },
  
  onMenuZoomToFit: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:zoom-to-fit', handler);
    return () => {
      ipcRenderer.removeListener('menu:zoom-to-fit', handler);
    };
  },
  
  onMenuZoomIn: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:zoom-in', handler);
    return () => {
      ipcRenderer.removeListener('menu:zoom-in', handler);
    };
  },
  
  onMenuZoomOut: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:zoom-out', handler);
    return () => {
      ipcRenderer.removeListener('menu:zoom-out', handler);
    };
  },
  
  onMenuLayout: (callback: (algorithm: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, algorithm: string) => {
      callback(algorithm);
    };
    ipcRenderer.on('menu:layout', handler);
    return () => {
      ipcRenderer.removeListener('menu:layout', handler);
    };
  },
  
  onMenuToggleSidePanel: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('menu:toggle-side-panel', handler);
    return () => {
      ipcRenderer.removeListener('menu:toggle-side-panel', handler);
    };
  },
  
  // Update event listeners
  onUpdateAvailable: (callback: (info: UpdateInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => {
      callback(info);
    };
    ipcRenderer.on('update:available', handler);
    return () => {
      ipcRenderer.removeListener('update:available', handler);
    };
  },
  
  onUpdateDownloadProgress: (callback: (progress: { percent: number }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: { percent: number }) => {
      callback(progress);
    };
    ipcRenderer.on('update:download-progress', handler);
    return () => {
      ipcRenderer.removeListener('update:download-progress', handler);
    };
  },
  
  onUpdateDownloaded: (callback: () => void): (() => void) => {
    const handler = () => {
      callback();
    };
    ipcRenderer.on('update:downloaded', handler);
    return () => {
      ipcRenderer.removeListener('update:downloaded', handler);
    };
  }
} as ElectronAPI);

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
