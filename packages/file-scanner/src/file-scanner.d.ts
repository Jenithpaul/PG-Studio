import { FileScanner, ProjectScanResult, SqlFile } from './types';
export declare class FileScannerImpl implements FileScanner {
    private readonly BACKEND_FOLDER_PATTERNS;
    private readonly MIGRATION_PATTERNS;
    scanProject(projectPath: string): Promise<ProjectScanResult>;
    findSqlFiles(directories: string[]): Promise<SqlFile[]>;
    detectMigrationOrder(files: SqlFile[]): SqlFile[];
    private detectBackendFolders;
    private classifyFolder;
    private calculateConfidence;
    private countSqlFiles;
    private recursiveScan;
    private shouldSkipDirectory;
    private createSqlFile;
    private classifySqlFile;
    private identifyMigrationFiles;
    private extractMigrationOrder;
    private generateSummary;
}
//# sourceMappingURL=file-scanner.d.ts.map