"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = exports.BackupService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ExceptionHandler_1 = require("./ExceptionHandler");
const Config_1 = require("../Config/Config");
const Storage_1 = require("../Storage/Storage");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class BackupService {
    get backupDirectory() {
        return Storage_1.Storage.resolvedPath('backups');
    }
    constructor() {
        this.ensureBackupDirectory();
    }
    /** Map paths stored inside backup archives (`storage/...`) to the live project. */
    projectPathFromArchiveRelative(archiveDir) {
        if (archiveDir === 'storage' || archiveDir.startsWith('storage/')) {
            const rest = archiveDir === 'storage' ? '' : archiveDir.slice('storage/'.length);
            const parts = rest.split('/').filter(Boolean);
            return parts.length ? Storage_1.Storage.resolvedPath(...parts) : Storage_1.Storage.resolvedPath();
        }
        return path_1.default.join(process.cwd(), archiveDir);
    }
    static getInstance() {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }
    ensureBackupDirectory() {
        if (!fs_1.default.existsSync(this.backupDirectory)) {
            fs_1.default.mkdirSync(this.backupDirectory, { recursive: true });
        }
    }
    /**
     * Create a full system backup
     */
    async createFullBackup(options = {}) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `full-backup-${timestamp}`;
        const backupPath = path_1.default.join(this.backupDirectory, backupName);
        try {
            // Create backup directory
            fs_1.default.mkdirSync(backupPath, { recursive: true });
            // Backup database
            if (options.database !== false) {
                await this.backupDatabase(backupPath);
            }
            // Backup files
            if (options.files !== false) {
                await this.backupFiles(backupPath);
            }
            // Backup logs
            if (options.logs !== false) {
                await this.backupLogs(backupPath);
            }
            // Create backup manifest
            await this.createBackupManifest(backupPath, options);
            // Compress if requested
            let finalPath = backupPath;
            if (options.compression !== false) {
                finalPath = await this.compressBackup(backupPath);
                // Remove uncompressed directory
                fs_1.default.rmSync(backupPath, { recursive: true, force: true });
            }
            const duration = Date.now() - startTime;
            const size = this.getDirectorySize(finalPath);
            ExceptionHandler_1.logger.info('Full backup completed successfully', {
                path: finalPath,
                size,
                duration
            });
            return {
                success: true,
                path: finalPath,
                size,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            ExceptionHandler_1.logger.error('Full backup failed', { error: error.message, path: backupPath });
            // Cleanup failed backup
            try {
                if (fs_1.default.existsSync(backupPath)) {
                    fs_1.default.rmSync(backupPath, { recursive: true, force: true });
                }
            }
            catch (cleanupError) {
                ExceptionHandler_1.logger.error('Failed to cleanup failed backup', { error: cleanupError.message });
            }
            return {
                success: false,
                duration,
                error: error.message
            };
        }
    }
    /**
     * Backup database
     */
    async backupDatabase(backupPath) {
        const dbPath = path_1.default.join(backupPath, 'database');
        if (Config_1.config.database?.driver === 'mongodb') {
            await this.backupMongoDB(dbPath);
        }
        else {
            // For other databases, you would implement specific backup logic
            ExceptionHandler_1.logger.warning('Database backup not implemented for driver:', { driver: Config_1.config.database?.driver });
        }
    }
    /**
     * Backup MongoDB database
     */
    async backupMongoDB(backupPath) {
        const dbName = Config_1.config.database?.database || 'bushjs';
        const dbHost = Config_1.config.database?.host || 'localhost';
        const dbPort = Config_1.config.database?.port || 27017;
        // Use mongodump for MongoDB backup
        const command = `mongodump --db ${dbName} --host ${dbHost} --port ${dbPort} --out ${backupPath}`;
        try {
            await execAsync(command);
            ExceptionHandler_1.logger.info('MongoDB backup completed', { database: dbName, path: backupPath });
        }
        catch (error) {
            // If mongodump is not available, try alternative method
            ExceptionHandler_1.logger.warning('mongodump not available, attempting alternative backup method');
            await this.backupMongoDBAlternative(backupPath);
        }
    }
    /**
     * Alternative MongoDB backup using mongoose
     */
    async backupMongoDBAlternative(backupPath) {
        // This would require mongoose connection and manual collection export
        // For now, just log that we need to implement this
        ExceptionHandler_1.logger.info('Alternative MongoDB backup - would implement mongoose-based export here');
    }
    /**
     * Backup application files
     */
    async backupFiles(backupPath) {
        const filesPath = path_1.default.join(backupPath, 'files');
        // Directories to backup
        const directoriesToBackup = [
            'storage/uploads',
            'storage/avatars',
            'storage/cache',
            'config',
            'database/schemas',
            'database/seeds'
        ];
        for (const dir of directoriesToBackup) {
            const sourcePath = this.projectPathFromArchiveRelative(dir);
            const targetPath = path_1.default.join(filesPath, dir);
            if (fs_1.default.existsSync(sourcePath)) {
                await this.copyDirectory(sourcePath, targetPath);
            }
        }
        ExceptionHandler_1.logger.info('Files backup completed', { path: filesPath });
    }
    /**
     * Backup logs
     */
    async backupLogs(backupPath) {
        const logsPath = path_1.default.join(backupPath, 'logs');
        const sourceLogsPath = Storage_1.Storage.resolvedPath('logs');
        if (fs_1.default.existsSync(sourceLogsPath)) {
            await this.copyDirectory(sourceLogsPath, logsPath);
        }
        ExceptionHandler_1.logger.info('Logs backup completed', { path: logsPath });
    }
    /**
     * Create backup manifest
     */
    async createBackupManifest(backupPath, options) {
        const manifest = {
            timestamp: new Date().toISOString(),
            version: require('../../../package.json').version,
            type: 'full',
            options,
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                environment: Config_1.config.app?.env || 'development'
            },
            contents: this.getDirectoryContents(backupPath)
        };
        const manifestPath = path_1.default.join(backupPath, 'manifest.json');
        fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
    /**
     * Compress backup
     */
    async compressBackup(backupPath) {
        const compressedPath = `${backupPath}.tar.gz`;
        try {
            // Use tar command for compression
            const command = `tar -czf ${compressedPath} -C ${path_1.default.dirname(backupPath)} ${path_1.default.basename(backupPath)}`;
            await execAsync(command);
            ExceptionHandler_1.logger.info('Backup compressed successfully', { path: compressedPath });
            return compressedPath;
        }
        catch (error) {
            ExceptionHandler_1.logger.warning('tar command not available, backup not compressed');
            return backupPath;
        }
    }
    /**
     * Restore from backup
     */
    async restoreBackup(backupPath) {
        const startTime = Date.now();
        try {
            // Check if backup is compressed
            if (backupPath.endsWith('.tar.gz')) {
                await this.decompressBackup(backupPath);
                backupPath = backupPath.replace('.tar.gz', '');
            }
            // Validate backup manifest
            const manifestPath = path_1.default.join(backupPath, 'manifest.json');
            if (!fs_1.default.existsSync(manifestPath)) {
                throw new Error('Invalid backup: manifest.json not found');
            }
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            // Restore database
            if (manifest.options.database !== false) {
                await this.restoreDatabase(backupPath);
            }
            // Restore files
            if (manifest.options.files !== false) {
                await this.restoreFiles(backupPath);
            }
            const duration = Date.now() - startTime;
            ExceptionHandler_1.logger.info('Backup restoration completed successfully', {
                path: backupPath,
                duration
            });
            return {
                success: true,
                path: backupPath,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            ExceptionHandler_1.logger.error('Backup restoration failed', { error: error.message, path: backupPath });
            return {
                success: false,
                duration,
                error: error.message
            };
        }
    }
    /**
     * Restore database
     */
    async restoreDatabase(backupPath) {
        const dbBackupPath = path_1.default.join(backupPath, 'database');
        if (fs_1.default.existsSync(dbBackupPath)) {
            if (Config_1.config.database?.driver === 'mongodb') {
                await this.restoreMongoDB(dbBackupPath);
            }
        }
    }
    /**
     * Restore MongoDB
     */
    async restoreMongoDB(backupPath) {
        const dbName = Config_1.config.database?.database || 'bushjs';
        const dbHost = Config_1.config.database?.host || 'localhost';
        const dbPort = Config_1.config.database?.port || 27017;
        const command = `mongorestore --db ${dbName} --host ${dbHost} --port ${dbPort} ${backupPath}`;
        try {
            await execAsync(command);
            ExceptionHandler_1.logger.info('MongoDB restoration completed', { database: dbName, path: backupPath });
        }
        catch (error) {
            ExceptionHandler_1.logger.error('MongoDB restoration failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Restore files
     */
    async restoreFiles(backupPath) {
        const filesBackupPath = path_1.default.join(backupPath, 'files');
        if (fs_1.default.existsSync(filesBackupPath)) {
            // Copy files back to their original locations
            const directoriesToRestore = [
                'storage/uploads',
                'storage/avatars',
                'storage/cache',
                'config',
                'database/schemas',
                'database/seeds'
            ];
            for (const dir of directoriesToRestore) {
                const sourcePath = path_1.default.join(filesBackupPath, dir);
                const targetPath = this.projectPathFromArchiveRelative(dir);
                if (fs_1.default.existsSync(sourcePath)) {
                    await this.copyDirectory(sourcePath, targetPath);
                }
            }
        }
    }
    /**
     * Decompress backup
     */
    async decompressBackup(compressedPath) {
        const extractPath = compressedPath.replace('.tar.gz', '');
        const command = `tar -xzf ${compressedPath} -C ${path_1.default.dirname(extractPath)}`;
        try {
            await execAsync(command);
            ExceptionHandler_1.logger.info('Backup decompressed successfully', { path: compressedPath });
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Failed to decompress backup', { error: error.message });
            throw error;
        }
    }
    /**
     * Utility methods
     */
    async copyDirectory(source, target) {
        const { copy } = await Promise.resolve().then(() => __importStar(require('fs-extra')));
        await copy(source, target);
    }
    getDirectorySize(dirPath) {
        let totalSize = 0;
        function calculateSize(itemPath) {
            const stats = fs_1.default.statSync(itemPath);
            if (stats.isDirectory()) {
                const items = fs_1.default.readdirSync(itemPath);
                items.forEach(item => {
                    calculateSize(path_1.default.join(itemPath, item));
                });
            }
            else {
                totalSize += stats.size;
            }
        }
        if (fs_1.default.existsSync(dirPath)) {
            calculateSize(dirPath);
        }
        return totalSize;
    }
    getDirectoryContents(dirPath) {
        const contents = {};
        function scanDirectory(currentPath, relativePath = '') {
            const items = fs_1.default.readdirSync(currentPath);
            items.forEach(item => {
                const itemPath = path_1.default.join(currentPath, item);
                const itemRelativePath = path_1.default.join(relativePath, item);
                const stats = fs_1.default.statSync(itemPath);
                if (stats.isDirectory()) {
                    contents[itemRelativePath + '/'] = 'directory';
                    scanDirectory(itemPath, itemRelativePath);
                }
                else {
                    contents[itemRelativePath] = stats.size;
                }
            });
        }
        if (fs_1.default.existsSync(dirPath)) {
            scanDirectory(dirPath);
        }
        return contents;
    }
    /**
     * List available backups
     */
    listBackups() {
        const backups = [];
        if (!fs_1.default.existsSync(this.backupDirectory)) {
            return backups;
        }
        const items = fs_1.default.readdirSync(this.backupDirectory);
        items.forEach(item => {
            const itemPath = path_1.default.join(this.backupDirectory, item);
            const stats = fs_1.default.statSync(itemPath);
            if (stats.isDirectory() || item.endsWith('.tar.gz')) {
                backups.push({
                    name: item,
                    path: itemPath,
                    size: this.getDirectorySize(itemPath),
                    created: stats.mtime
                });
            }
        });
        return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    }
    /**
     * Clean old backups
     */
    async cleanupOldBackups(keepDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - keepDays);
        const backups = this.listBackups();
        for (const backup of backups) {
            if (backup.created < cutoffDate) {
                try {
                    if (fs_1.default.statSync(backup.path).isDirectory()) {
                        fs_1.default.rmSync(backup.path, { recursive: true, force: true });
                    }
                    else {
                        fs_1.default.unlinkSync(backup.path);
                    }
                    ExceptionHandler_1.logger.info('Cleaned up old backup', { name: backup.name, path: backup.path });
                }
                catch (error) {
                    ExceptionHandler_1.logger.error('Failed to cleanup old backup', { error: error.message, path: backup.path });
                }
            }
        }
    }
}
exports.BackupService = BackupService;
// Export singleton instance
exports.backupService = BackupService.getInstance();
//# sourceMappingURL=BackupService.js.map