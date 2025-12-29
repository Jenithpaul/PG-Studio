import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

// Note: In a production app, you would use electron-updater
// This is a simplified implementation for the update handling framework

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl?: string;
}

export interface UpdateManagerConfig {
  checkInterval?: number; // milliseconds
  autoDownload?: boolean;
  autoInstall?: boolean;
}

const defaultConfig: UpdateManagerConfig = {
  checkInterval: 60 * 60 * 1000, // 1 hour
  autoDownload: false,
  autoInstall: false,
};

class UpdateManager {
  private config: UpdateManagerConfig;
  private mainWindow: BrowserWindow | null = null;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private updateAvailable: UpdateInfo | null = null;

  constructor(config: Partial<UpdateManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupIpcHandlers();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private setupIpcHandlers() {
    // Check for updates manually
    ipcMain.handle('update:check', async () => {
      return await this.checkForUpdates();
    });

    // Get current update info
    ipcMain.handle('update:getInfo', () => {
      return this.updateAvailable;
    });

    // Download update
    ipcMain.handle('update:download', async () => {
      return await this.downloadUpdate();
    });

    // Install update (quit and install)
    ipcMain.handle('update:install', async () => {
      return await this.installUpdate();
    });

    // Get app version
    ipcMain.handle('update:getVersion', () => {
      return app.getVersion();
    });

    // Dismiss update notification
    ipcMain.handle('update:dismiss', () => {
      this.updateAvailable = null;
      return true;
    });
  }

  async checkForUpdates(): Promise<{ available: boolean; info?: UpdateInfo; error?: string }> {
    try {
      // In a real implementation, this would check a remote server
      // For now, we'll simulate the check
      const currentVersion = app.getVersion();
      
      // Simulated update check - in production, fetch from your update server
      // const response = await fetch('https://your-update-server.com/api/updates/latest');
      // const latestInfo = await response.json();
      
      // For demonstration, we'll return no update available
      const latestVersion = currentVersion; // Would come from server
      
      if (this.isNewerVersion(latestVersion, currentVersion)) {
        this.updateAvailable = {
          version: latestVersion,
          releaseDate: new Date().toISOString(),
          releaseNotes: 'Bug fixes and performance improvements.',
        };
        
        this.notifyUpdateAvailable();
        
        return { available: true, info: this.updateAvailable };
      }
      
      return { available: false };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { available: false, error: (error as Error).message };
    }
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  }

  private notifyUpdateAvailable() {
    if (this.mainWindow && this.updateAvailable) {
      this.mainWindow.webContents.send('update:available', this.updateAvailable);
    }
  }

  async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.updateAvailable) {
        return { success: false, error: 'No update available' };
      }

      // In a real implementation, this would download the update
      // using electron-updater or a custom download mechanism
      
      this.mainWindow?.webContents.send('update:download-progress', { percent: 0 });
      
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.mainWindow?.webContents.send('update:download-progress', { percent: i });
      }
      
      this.mainWindow?.webContents.send('update:downloaded');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to download update:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async installUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.updateAvailable) {
        return { success: false, error: 'No update available' };
      }

      // Show confirmation dialog
      const result = await dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Install Update',
        message: `Version ${this.updateAvailable.version} is ready to install.`,
        detail: 'The application will restart to complete the update. Your data will be preserved.',
        buttons: ['Install Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      });

      if (result.response === 0) {
        // In a real implementation with electron-updater:
        // autoUpdater.quitAndInstall();
        
        // For now, just restart the app
        app.relaunch();
        app.exit(0);
        
        return { success: true };
      }
      
      return { success: false, error: 'User cancelled' };
    } catch (error) {
      console.error('Failed to install update:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  startAutoCheck() {
    if (this.config.checkInterval && this.config.checkInterval > 0) {
      // Check immediately on start
      this.checkForUpdates();
      
      // Then check periodically
      this.checkIntervalId = setInterval(() => {
        this.checkForUpdates();
      }, this.config.checkInterval);
    }
  }

  stopAutoCheck() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }
}

// Data preservation utilities
export class DataPreservation {
  private static readonly DATA_DIR = 'pg-studio-data';
  
  static getDataPath(): string {
    return path.join(app.getPath('userData'), this.DATA_DIR);
  }

  static ensureDataDirectory(): void {
    const dataPath = this.getDataPath();
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
  }

  static async backupUserData(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      this.ensureDataDirectory();
      
      const dataPath = this.getDataPath();
      const backupPath = path.join(app.getPath('userData'), `backup-${Date.now()}`);
      
      if (fs.existsSync(dataPath)) {
        await fs.promises.cp(dataPath, backupPath, { recursive: true });
        return { success: true, backupPath };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to backup user data:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  static async restoreUserData(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dataPath = this.getDataPath();
      
      if (fs.existsSync(backupPath)) {
        // Remove current data
        if (fs.existsSync(dataPath)) {
          await fs.promises.rm(dataPath, { recursive: true });
        }
        
        // Restore from backup
        await fs.promises.cp(backupPath, dataPath, { recursive: true });
        return { success: true };
      }
      
      return { success: false, error: 'Backup not found' };
    } catch (error) {
      console.error('Failed to restore user data:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  static async saveProjectState(projectPath: string, state: object): Promise<void> {
    this.ensureDataDirectory();
    
    const stateFile = path.join(
      this.getDataPath(),
      `project-${Buffer.from(projectPath).toString('base64').replace(/[/+=]/g, '_')}.json`
    );
    
    await fs.promises.writeFile(stateFile, JSON.stringify(state, null, 2));
  }

  static async loadProjectState(projectPath: string): Promise<object | null> {
    try {
      const stateFile = path.join(
        this.getDataPath(),
        `project-${Buffer.from(projectPath).toString('base64').replace(/[/+=]/g, '_')}.json`
      );
      
      if (fs.existsSync(stateFile)) {
        const content = await fs.promises.readFile(stateFile, 'utf-8');
        return JSON.parse(content);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load project state:', error);
      return null;
    }
  }

  static async getRecentProjects(): Promise<string[]> {
    try {
      const recentFile = path.join(this.getDataPath(), 'recent-projects.json');
      
      if (fs.existsSync(recentFile)) {
        const content = await fs.promises.readFile(recentFile, 'utf-8');
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get recent projects:', error);
      return [];
    }
  }

  static async addRecentProject(projectPath: string): Promise<void> {
    this.ensureDataDirectory();
    
    const recentFile = path.join(this.getDataPath(), 'recent-projects.json');
    let recent: string[] = [];
    
    try {
      if (fs.existsSync(recentFile)) {
        const content = await fs.promises.readFile(recentFile, 'utf-8');
        recent = JSON.parse(content);
      }
    } catch {
      recent = [];
    }
    
    // Remove if already exists and add to front
    recent = recent.filter(p => p !== projectPath);
    recent.unshift(projectPath);
    
    // Keep only last 10
    recent = recent.slice(0, 10);
    
    await fs.promises.writeFile(recentFile, JSON.stringify(recent, null, 2));
  }

  static async clearRecentProjects(): Promise<void> {
    const recentFile = path.join(this.getDataPath(), 'recent-projects.json');
    
    if (fs.existsSync(recentFile)) {
      await fs.promises.unlink(recentFile);
    }
  }
}

// Setup IPC handlers for data preservation
export function setupDataPreservationHandlers() {
  ipcMain.handle('data:backup', async () => {
    return await DataPreservation.backupUserData();
  });

  ipcMain.handle('data:restore', async (_, backupPath: string) => {
    return await DataPreservation.restoreUserData(backupPath);
  });

  ipcMain.handle('data:saveProjectState', async (_, projectPath: string, state: object) => {
    await DataPreservation.saveProjectState(projectPath, state);
    return { success: true };
  });

  ipcMain.handle('data:loadProjectState', async (_, projectPath: string) => {
    return await DataPreservation.loadProjectState(projectPath);
  });

  ipcMain.handle('data:getRecentProjects', async () => {
    return await DataPreservation.getRecentProjects();
  });

  ipcMain.handle('data:addRecentProject', async (_, projectPath: string) => {
    await DataPreservation.addRecentProject(projectPath);
    return { success: true };
  });

  ipcMain.handle('data:clearRecentProjects', async () => {
    await DataPreservation.clearRecentProjects();
    return { success: true };
  });
}

export const updateManager = new UpdateManager();
export default updateManager;
