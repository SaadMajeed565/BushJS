import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from './ExceptionHandler';
import { config } from '../Config/Config';
import { Storage } from '../Storage/Storage';

const execAsync = promisify(exec);

export interface BackupOptions {
  database?: boolean;
  files?: boolean;
  logs?: boolean;
  destination?: string;
  compression?: boolean;
}

export interface BackupResult {
  success: boolean;
  path?: string;
  size?: number;
  duration: number;
  error?: string;
}

export class BackupService {
  private static instance: BackupService;

  private get backupDirectory(): string {
    return Storage.resolvedPath('backups');
  }

  private constructor() {
    this.ensureBackupDirectory();
  }

  /** Map paths stored inside backup archives (`storage/...`) to the live project. */
  private projectPathFromArchiveRelative(archiveDir: string): string {
    if (archiveDir === 'storage' || archiveDir.startsWith('storage/')) {
      const rest = archiveDir === 'storage' ? '' : archiveDir.slice('storage/'.length);
      const parts = rest.split('/').filter(Boolean);
      return parts.length ? Storage.resolvedPath(...parts) : Storage.resolvedPath();
    }
    return path.join(process.cwd(), archiveDir);
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  /**
   * Create a full system backup
   */
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full-backup-${timestamp}`;
    const backupPath = path.join(this.backupDirectory, backupName);

    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

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
        fs.rmSync(backupPath, { recursive: true, force: true });
      }

      const duration = Date.now() - startTime;
      const size = this.getDirectorySize(finalPath);

      logger.info('Full backup completed successfully', {
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

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Full backup failed', { error: (error as Error).message, path: backupPath });

      // Cleanup failed backup
      try {
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        logger.error('Failed to cleanup failed backup', { error: (cleanupError as Error).message });
      }

      return {
        success: false,
        duration,
        error: (error as Error).message
      };
    }
  }

  /**
   * Backup database
   */
  private async backupDatabase(backupPath: string): Promise<void> {
    const dbPath = path.join(backupPath, 'database');

    if (config.database?.driver === 'mongodb') {
      await this.backupMongoDB(dbPath);
    } else {
      // For other databases, you would implement specific backup logic
      logger.warning('Database backup not implemented for driver:', { driver: config.database?.driver });
    }
  }

  /**
   * Backup MongoDB database
   */
  private async backupMongoDB(backupPath: string): Promise<void> {
    const dbName = config.database?.database || 'bushjs';
    const dbHost = config.database?.host || 'localhost';
    const dbPort = config.database?.port || 27017;

    // Use mongodump for MongoDB backup
    const command = `mongodump --db ${dbName} --host ${dbHost} --port ${dbPort} --out ${backupPath}`;

    try {
      await execAsync(command);
      logger.info('MongoDB backup completed', { database: dbName, path: backupPath });
    } catch (error) {
      // If mongodump is not available, try alternative method
      logger.warning('mongodump not available, attempting alternative backup method');
      await this.backupMongoDBAlternative(backupPath);
    }
  }

  /**
   * Alternative MongoDB backup using mongoose
   */
  private async backupMongoDBAlternative(backupPath: string): Promise<void> {
    // This would require mongoose connection and manual collection export
    // For now, just log that we need to implement this
    logger.info('Alternative MongoDB backup - would implement mongoose-based export here');
  }

  /**
   * Backup application files
   */
  private async backupFiles(backupPath: string): Promise<void> {
    const filesPath = path.join(backupPath, 'files');

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
      const targetPath = path.join(filesPath, dir);

      if (fs.existsSync(sourcePath)) {
        await this.copyDirectory(sourcePath, targetPath);
      }
    }

    logger.info('Files backup completed', { path: filesPath });
  }

  /**
   * Backup logs
   */
  private async backupLogs(backupPath: string): Promise<void> {
    const logsPath = path.join(backupPath, 'logs');
    const sourceLogsPath = Storage.resolvedPath('logs');

    if (fs.existsSync(sourceLogsPath)) {
      await this.copyDirectory(sourceLogsPath, logsPath);
    }

    logger.info('Logs backup completed', { path: logsPath });
  }

  /**
   * Create backup manifest
   */
  private async createBackupManifest(backupPath: string, options: BackupOptions): Promise<void> {
    const manifest = {
      timestamp: new Date().toISOString(),
      version: require('../../../package.json').version,
      type: 'full',
      options,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        environment: config.app?.env || 'development'
      },
      contents: this.getDirectoryContents(backupPath)
    };

    const manifestPath = path.join(backupPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Compress backup
   */
  private async compressBackup(backupPath: string): Promise<string> {
    const compressedPath = `${backupPath}.tar.gz`;

    try {
      // Use tar command for compression
      const command = `tar -czf ${compressedPath} -C ${path.dirname(backupPath)} ${path.basename(backupPath)}`;
      await execAsync(command);

      logger.info('Backup compressed successfully', { path: compressedPath });
      return compressedPath;
    } catch (error) {
      logger.warning('tar command not available, backup not compressed');
      return backupPath;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath: string): Promise<BackupResult> {
    const startTime = Date.now();

    try {
      // Check if backup is compressed
      if (backupPath.endsWith('.tar.gz')) {
        await this.decompressBackup(backupPath);
        backupPath = backupPath.replace('.tar.gz', '');
      }

      // Validate backup manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Invalid backup: manifest.json not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Restore database
      if (manifest.options.database !== false) {
        await this.restoreDatabase(backupPath);
      }

      // Restore files
      if (manifest.options.files !== false) {
        await this.restoreFiles(backupPath);
      }

      const duration = Date.now() - startTime;

      logger.info('Backup restoration completed successfully', {
        path: backupPath,
        duration
      });

      return {
        success: true,
        path: backupPath,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Backup restoration failed', { error: (error as Error).message, path: backupPath });

      return {
        success: false,
        duration,
        error: (error as Error).message
      };
    }
  }

  /**
   * Restore database
   */
  private async restoreDatabase(backupPath: string): Promise<void> {
    const dbBackupPath = path.join(backupPath, 'database');

    if (fs.existsSync(dbBackupPath)) {
      if (config.database?.driver === 'mongodb') {
        await this.restoreMongoDB(dbBackupPath);
      }
    }
  }

  /**
   * Restore MongoDB
   */
  private async restoreMongoDB(backupPath: string): Promise<void> {
    const dbName = config.database?.database || 'bushjs';
    const dbHost = config.database?.host || 'localhost';
    const dbPort = config.database?.port || 27017;

    const command = `mongorestore --db ${dbName} --host ${dbHost} --port ${dbPort} ${backupPath}`;

    try {
      await execAsync(command);
      logger.info('MongoDB restoration completed', { database: dbName, path: backupPath });
    } catch (error) {
      logger.error('MongoDB restoration failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Restore files
   */
  private async restoreFiles(backupPath: string): Promise<void> {
    const filesBackupPath = path.join(backupPath, 'files');

    if (fs.existsSync(filesBackupPath)) {
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
        const sourcePath = path.join(filesBackupPath, dir);
        const targetPath = this.projectPathFromArchiveRelative(dir);

        if (fs.existsSync(sourcePath)) {
          await this.copyDirectory(sourcePath, targetPath);
        }
      }
    }
  }

  /**
   * Decompress backup
   */
  private async decompressBackup(compressedPath: string): Promise<void> {
    const extractPath = compressedPath.replace('.tar.gz', '');
    const command = `tar -xzf ${compressedPath} -C ${path.dirname(extractPath)}`;

    try {
      await execAsync(command);
      logger.info('Backup decompressed successfully', { path: compressedPath });
    } catch (error) {
      logger.error('Failed to decompress backup', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Utility methods
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    const { copy } = await import('fs-extra');
    await copy(source, target);
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;

    function calculateSize(itemPath: string): void {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        items.forEach(item => {
          calculateSize(path.join(itemPath, item));
        });
      } else {
        totalSize += stats.size;
      }
    }

    if (fs.existsSync(dirPath)) {
      calculateSize(dirPath);
    }

    return totalSize;
  }

  private getDirectoryContents(dirPath: string): any {
    const contents: any = {};

    function scanDirectory(currentPath: string, relativePath: string = ''): void {
      const items = fs.readdirSync(currentPath);

      items.forEach(item => {
        const itemPath = path.join(currentPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          contents[itemRelativePath + '/'] = 'directory';
          scanDirectory(itemPath, itemRelativePath);
        } else {
          contents[itemRelativePath] = stats.size;
        }
      });
    }

    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    }

    return contents;
  }

  /**
   * List available backups
   */
  listBackups(): Array<{ name: string; path: string; size: number; created: Date }> {
    const backups: Array<{ name: string; path: string; size: number; created: Date }> = [];

    if (!fs.existsSync(this.backupDirectory)) {
      return backups;
    }

    const items = fs.readdirSync(this.backupDirectory);

    items.forEach(item => {
      const itemPath = path.join(this.backupDirectory, item);
      const stats = fs.statSync(itemPath);

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
  async cleanupOldBackups(keepDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const backups = this.listBackups();

    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        try {
          if (fs.statSync(backup.path).isDirectory()) {
            fs.rmSync(backup.path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(backup.path);
          }
          logger.info('Cleaned up old backup', { name: backup.name, path: backup.path });
        } catch (error) {
          logger.error('Failed to cleanup old backup', { error: (error as Error).message, path: backup.path });
        }
      }
    }
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();