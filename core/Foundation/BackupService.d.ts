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
export declare class BackupService {
    private static instance;
    private get backupDirectory();
    private constructor();
    /** Map paths stored inside backup archives (`storage/...`) to the live project. */
    private projectPathFromArchiveRelative;
    static getInstance(): BackupService;
    private ensureBackupDirectory;
    /**
     * Create a full system backup
     */
    createFullBackup(options?: BackupOptions): Promise<BackupResult>;
    /**
     * Backup database
     */
    private backupDatabase;
    /**
     * Backup MongoDB database
     */
    private backupMongoDB;
    /**
     * Alternative MongoDB backup using mongoose
     */
    private backupMongoDBAlternative;
    /**
     * Backup application files
     */
    private backupFiles;
    /**
     * Backup logs
     */
    private backupLogs;
    /**
     * Create backup manifest
     */
    private createBackupManifest;
    /**
     * Compress backup
     */
    private compressBackup;
    /**
     * Restore from backup
     */
    restoreBackup(backupPath: string): Promise<BackupResult>;
    /**
     * Restore database
     */
    private restoreDatabase;
    /**
     * Restore MongoDB
     */
    private restoreMongoDB;
    /**
     * Restore files
     */
    private restoreFiles;
    /**
     * Decompress backup
     */
    private decompressBackup;
    /**
     * Utility methods
     */
    private copyDirectory;
    private getDirectorySize;
    private getDirectoryContents;
    /**
     * List available backups
     */
    listBackups(): Array<{
        name: string;
        path: string;
        size: number;
        created: Date;
    }>;
    /**
     * Clean old backups
     */
    cleanupOldBackups(keepDays?: number): Promise<void>;
}
export declare const backupService: BackupService;
//# sourceMappingURL=BackupService.d.ts.map