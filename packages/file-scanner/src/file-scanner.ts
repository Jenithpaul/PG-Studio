import { promises as fs } from 'fs';
import path from 'path';
import { FileScanner, ProjectScanResult, DetectedFolder, SqlFile, ScanSummary, FileScanWarning } from './types';

/**
 * File system error with enhanced metadata
 */
export interface FileSystemError extends Error {
  code: string;
  path: string;
  recoverable: boolean;
  suggestedActions: string[];
}

/**
 * Create a file system error with helpful metadata
 */
function createFileSystemError(
  error: Error,
  filePath: string
): FileSystemError {
  const fsError = error as FileSystemError;
  const errorCode = (error as any).code || 'UNKNOWN';
  
  fsError.code = errorCode;
  fsError.path = filePath;
  fsError.recoverable = !['ENOENT', 'EACCES', 'EPERM'].includes(errorCode);
  fsError.suggestedActions = getFileSystemSuggestedActions(errorCode);
  
  return fsError;
}

/**
 * Get suggested actions for file system errors
 */
function getFileSystemSuggestedActions(errorCode: string): string[] {
  switch (errorCode) {
    case 'ENOENT':
      return [
        'Verify the file or folder path is correct',
        'Check if the file has been moved or deleted',
        'Select a different location'
      ];
    case 'EACCES':
    case 'EPERM':
      return [
        'Check file/folder permissions',
        'Run the application with appropriate permissions',
        'Select a different folder'
      ];
    case 'ENOSPC':
      return [
        'Free up disk space',
        'Save to a different location',
        'Delete unnecessary files'
      ];
    case 'ENAMETOOLONG':
      return [
        'Move files to a shorter path',
        'Rename folders to shorter names',
        'Use a different location'
      ];
    default:
      return [
        'Check the file or folder exists',
        'Verify you have access permissions',
        'Try selecting a different location'
      ];
  }
}

export class FileScannerImpl implements FileScanner {
  private readonly BACKEND_FOLDER_PATTERNS = [
    'backend',
    'server', 
    'api',
    'db',
    'database',
    'migrations'
  ];

  private readonly MIGRATION_PATTERNS = [
    /^\d{4}_\d{2}_\d{2}_\d{6}/,  // YYYY_MM_DD_HHMMSS
    /^\d{14}/,                    // YYYYMMDDHHMMSS
    /^\d{10}/,                    // Unix timestamp
    /^V\d+__/,                    // Flyway style V1__
    /^\d+_/,                      // Simple numeric prefix
  ];

  // Track warnings during scanning
  private scanWarnings: FileScanWarning[] = [];

  async scanProject(projectPath: string): Promise<ProjectScanResult> {
    this.scanWarnings = []; // Reset warnings
    
    // Validate project path exists
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${projectPath}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw createFileSystemError(err, projectPath);
    }
    
    const detectedFolders = await this.detectBackendFolders(projectPath);
    
    // Get directories to scan - either detected backend folders or full project
    const directoriesToScan = detectedFolders.length > 0 
      ? detectedFolders.map(f => f.path)
      : [projectPath];

    const sqlFiles = await this.findSqlFiles(directoriesToScan);
    const migrationFiles = this.identifyMigrationFiles(sqlFiles);
    const orderedMigrationFiles = this.detectMigrationOrder(migrationFiles);
    
    const summary = this.generateSummary(sqlFiles, orderedMigrationFiles, detectedFolders);

    return {
      projectPath,
      detectedFolders,
      sqlFiles,
      migrationFiles: orderedMigrationFiles,
      summary,
      warnings: this.scanWarnings
    };
  }

  async findSqlFiles(directories: string[]): Promise<SqlFile[]> {
    const sqlFiles: SqlFile[] = [];

    for (const directory of directories) {
      try {
        const files = await this.recursiveScan(directory, '.sql');
        for (const filePath of files) {
          const sqlFile = await this.createSqlFile(filePath);
          sqlFiles.push(sqlFile);
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${directory}:`, error);
      }
    }

    return sqlFiles;
  }

  detectMigrationOrder(files: SqlFile[]): SqlFile[] {
    const migrationFiles = files.filter(f => f.type === 'migration');
    
    return migrationFiles
      .map(file => ({
        ...file,
        migrationOrder: this.extractMigrationOrder(file.name)
      }))
      .sort((a, b) => {
        if (a.migrationOrder !== undefined && b.migrationOrder !== undefined) {
          return a.migrationOrder - b.migrationOrder;
        }
        if (a.migrationOrder !== undefined) return -1;
        if (b.migrationOrder !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  private async detectBackendFolders(projectPath: string): Promise<DetectedFolder[]> {
    const detectedFolders: DetectedFolder[] = [];

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(projectPath, entry.name);
          const folderType = this.classifyFolder(entry.name);
          
          if (folderType) {
            const sqlFileCount = await this.countSqlFiles(folderPath);
            const confidence = this.calculateConfidence(entry.name, sqlFileCount);
            
            detectedFolders.push({
              path: folderPath,
              type: folderType,
              confidence,
              sqlFileCount
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan project directory ${projectPath}:`, error);
    }

    return detectedFolders.sort((a, b) => b.confidence - a.confidence);
  }

  private classifyFolder(folderName: string): DetectedFolder['type'] | null {
    const lowerName = folderName.toLowerCase();
    
    for (const pattern of this.BACKEND_FOLDER_PATTERNS) {
      if (lowerName.includes(pattern)) {
        return pattern as DetectedFolder['type'];
      }
    }
    
    return null;
  }

  private calculateConfidence(folderName: string, sqlFileCount: number): number {
    let confidence = 0;
    const lowerName = folderName.toLowerCase();
    
    // Base confidence from folder name match
    if (lowerName === 'migrations') confidence += 0.9;
    else if (lowerName === 'database' || lowerName === 'db') confidence += 0.8;
    else if (lowerName === 'backend') confidence += 0.7;
    else if (lowerName === 'server' || lowerName === 'api') confidence += 0.6;
    else confidence += 0.3; // Partial match
    
    // Boost confidence based on SQL file count
    if (sqlFileCount > 10) confidence += 0.1;
    else if (sqlFileCount > 5) confidence += 0.05;
    else if (sqlFileCount === 0) confidence -= 0.2;
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private async countSqlFiles(directoryPath: string): Promise<number> {
    try {
      const files = await this.recursiveScan(directoryPath, '.sql');
      return files.length;
    } catch {
      return 0;
    }
  }

  private async recursiveScan(directoryPath: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common non-relevant directories
          if (!this.shouldSkipDirectory(entry.name)) {
            const subFiles = await this.recursiveScan(fullPath, extension);
            files.push(...subFiles);
          }
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      const errorCode = (error as any).code || 'UNKNOWN';
      this.scanWarnings.push({
        message: `Failed to scan directory: ${(error as Error).message}`,
        path: directoryPath,
        errorCode
      });
    }
    
    return files;
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.svn',
      'dist',
      'build',
      'target',
      '.next',
      'coverage',
      '.nyc_output'
    ];
    
    return skipPatterns.some(pattern => 
      dirName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private async createSqlFile(filePath: string): Promise<SqlFile> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    return {
      path: filePath,
      name: fileName,
      size: stats.size,
      lastModified: stats.mtime,
      type: this.classifySqlFile(fileName),
      migrationOrder: undefined
    };
  }

  private classifySqlFile(fileName: string): SqlFile['type'] {
    const lowerName = fileName.toLowerCase();
    
    // Check for migration patterns
    if (this.MIGRATION_PATTERNS.some(pattern => pattern.test(fileName))) {
      return 'migration';
    }
    
    // Check for common naming patterns
    if (lowerName.includes('migration')) return 'migration';
    if (lowerName.includes('view')) return 'view';
    if (lowerName.includes('function') || lowerName.includes('proc')) return 'function';
    if (lowerName.includes('table') || lowerName.includes('create')) return 'table';
    
    return 'unknown';
  }

  private identifyMigrationFiles(sqlFiles: SqlFile[]): SqlFile[] {
    return sqlFiles.filter(file => file.type === 'migration');
  }

  private extractMigrationOrder(fileName: string): number | undefined {
    // Try different migration patterns
    for (const pattern of this.MIGRATION_PATTERNS) {
      const match = fileName.match(pattern);
      if (match) {
        const numberStr = match[0].replace(/[^\d]/g, '');
        const number = parseInt(numberStr, 10);
        if (!isNaN(number)) {
          return number;
        }
      }
    }
    
    return undefined;
  }

  private generateSummary(
    sqlFiles: SqlFile[], 
    migrationFiles: SqlFile[], 
    detectedFolders: DetectedFolder[]
  ): ScanSummary {
    let largestFile: { name: string; size: number } | null = null;
    let oldestFile: { name: string; date: Date } | null = null;
    let newestFile: { name: string; date: Date } | null = null;

    for (const file of sqlFiles) {
      if (!largestFile || file.size > largestFile.size) {
        largestFile = { name: file.name, size: file.size };
      }
      
      if (!oldestFile || file.lastModified < oldestFile.date) {
        oldestFile = { name: file.name, date: file.lastModified };
      }
      
      if (!newestFile || file.lastModified > newestFile.date) {
        newestFile = { name: file.name, date: file.lastModified };
      }
    }

    return {
      totalSqlFiles: sqlFiles.length,
      totalMigrationFiles: migrationFiles.length,
      detectedFoldersCount: detectedFolders.length,
      largestFile,
      oldestFile,
      newestFile
    };
  }
}