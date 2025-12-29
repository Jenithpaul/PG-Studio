// Type declarations for Electron API exposed via preload script

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

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
