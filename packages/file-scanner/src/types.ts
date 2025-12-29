/**
 * Warning generated during file scanning
 */
export interface FileScanWarning {
  message: string;
  path: string;
  errorCode?: string;
}

export interface ProjectScanResult {
  projectPath: string;
  detectedFolders: DetectedFolder[];
  sqlFiles: SqlFile[];
  migrationFiles: SqlFile[];
  summary: ScanSummary;
  warnings?: FileScanWarning[];
}

export interface DetectedFolder {
  path: string;
  type: 'backend' | 'server' | 'api' | 'db' | 'database' | 'migrations';
  confidence: number;
  sqlFileCount: number;
}

export interface SqlFile {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  type: 'table' | 'migration' | 'view' | 'function' | 'unknown';
  migrationOrder?: number;
}

export interface ScanSummary {
  totalSqlFiles: number;
  totalMigrationFiles: number;
  detectedFoldersCount: number;
  largestFile: { name: string; size: number } | null;
  oldestFile: { name: string; date: Date } | null;
  newestFile: { name: string; date: Date } | null;
}

export interface FileScanner {
  scanProject(projectPath: string): Promise<ProjectScanResult>;
  findSqlFiles(directories: string[]): Promise<SqlFile[]>;
  detectMigrationOrder(files: SqlFile[]): SqlFile[];
}