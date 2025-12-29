"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScannerImpl = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class FileScannerImpl {
    constructor() {
        this.BACKEND_FOLDER_PATTERNS = [
            'backend',
            'server',
            'api',
            'db',
            'database',
            'migrations'
        ];
        this.MIGRATION_PATTERNS = [
            /^\d{4}_\d{2}_\d{2}_\d{6}/, // YYYY_MM_DD_HHMMSS
            /^\d{14}/, // YYYYMMDDHHMMSS
            /^\d{10}/, // Unix timestamp
            /^V\d+__/, // Flyway style V1__
            /^\d+_/, // Simple numeric prefix
        ];
    }
    async scanProject(projectPath) {
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
            summary
        };
    }
    async findSqlFiles(directories) {
        const sqlFiles = [];
        for (const directory of directories) {
            try {
                const files = await this.recursiveScan(directory, '.sql');
                for (const filePath of files) {
                    const sqlFile = await this.createSqlFile(filePath);
                    sqlFiles.push(sqlFile);
                }
            }
            catch (error) {
                console.warn(`Failed to scan directory ${directory}:`, error);
            }
        }
        return sqlFiles;
    }
    detectMigrationOrder(files) {
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
            if (a.migrationOrder !== undefined)
                return -1;
            if (b.migrationOrder !== undefined)
                return 1;
            return a.name.localeCompare(b.name);
        });
    }
    async detectBackendFolders(projectPath) {
        const detectedFolders = [];
        try {
            const entries = await fs_1.promises.readdir(projectPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const folderPath = path_1.default.join(projectPath, entry.name);
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
        }
        catch (error) {
            console.warn(`Failed to scan project directory ${projectPath}:`, error);
        }
        return detectedFolders.sort((a, b) => b.confidence - a.confidence);
    }
    classifyFolder(folderName) {
        const lowerName = folderName.toLowerCase();
        for (const pattern of this.BACKEND_FOLDER_PATTERNS) {
            if (lowerName.includes(pattern)) {
                return pattern;
            }
        }
        return null;
    }
    calculateConfidence(folderName, sqlFileCount) {
        let confidence = 0;
        const lowerName = folderName.toLowerCase();
        // Base confidence from folder name match
        if (lowerName === 'migrations')
            confidence += 0.9;
        else if (lowerName === 'database' || lowerName === 'db')
            confidence += 0.8;
        else if (lowerName === 'backend')
            confidence += 0.7;
        else if (lowerName === 'server' || lowerName === 'api')
            confidence += 0.6;
        else
            confidence += 0.3; // Partial match
        // Boost confidence based on SQL file count
        if (sqlFileCount > 10)
            confidence += 0.1;
        else if (sqlFileCount > 5)
            confidence += 0.05;
        else if (sqlFileCount === 0)
            confidence -= 0.2;
        return Math.min(1.0, Math.max(0.0, confidence));
    }
    async countSqlFiles(directoryPath) {
        try {
            const files = await this.recursiveScan(directoryPath, '.sql');
            return files.length;
        }
        catch {
            return 0;
        }
    }
    async recursiveScan(directoryPath, extension) {
        const files = [];
        try {
            const entries = await fs_1.promises.readdir(directoryPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(directoryPath, entry.name);
                if (entry.isDirectory()) {
                    // Skip common non-relevant directories
                    if (!this.shouldSkipDirectory(entry.name)) {
                        const subFiles = await this.recursiveScan(fullPath, extension);
                        files.push(...subFiles);
                    }
                }
                else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to scan directory ${directoryPath}:`, error);
        }
        return files;
    }
    shouldSkipDirectory(dirName) {
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
        return skipPatterns.some(pattern => dirName.toLowerCase().includes(pattern.toLowerCase()));
    }
    async createSqlFile(filePath) {
        const stats = await fs_1.promises.stat(filePath);
        const fileName = path_1.default.basename(filePath);
        return {
            path: filePath,
            name: fileName,
            size: stats.size,
            lastModified: stats.mtime,
            type: this.classifySqlFile(fileName),
            migrationOrder: undefined
        };
    }
    classifySqlFile(fileName) {
        const lowerName = fileName.toLowerCase();
        // Check for migration patterns
        if (this.MIGRATION_PATTERNS.some(pattern => pattern.test(fileName))) {
            return 'migration';
        }
        // Check for common naming patterns
        if (lowerName.includes('migration'))
            return 'migration';
        if (lowerName.includes('view'))
            return 'view';
        if (lowerName.includes('function') || lowerName.includes('proc'))
            return 'function';
        if (lowerName.includes('table') || lowerName.includes('create'))
            return 'table';
        return 'unknown';
    }
    identifyMigrationFiles(sqlFiles) {
        return sqlFiles.filter(file => file.type === 'migration');
    }
    extractMigrationOrder(fileName) {
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
    generateSummary(sqlFiles, migrationFiles, detectedFolders) {
        let largestFile = null;
        let oldestFile = null;
        let newestFile = null;
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
exports.FileScannerImpl = FileScannerImpl;
//# sourceMappingURL=file-scanner.js.map