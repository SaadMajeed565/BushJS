import type { FilesystemsConfig } from '../Config/Config';
import type { FilesystemAdapter } from './FilesystemAdapter';
import { FilesystemManager } from './FilesystemManager';
export declare class Storage {
    static init(basePath: string, filesystems: FilesystemsConfig): void;
    static bind(instance: FilesystemManager): void;
    static getManager(): FilesystemManager | null;
    static disk(name?: string): FilesystemAdapter;
    static path(...segments: string[]): string;
    /**
     * Absolute path under the configured storage root. Works before `Storage.init` using
     * `process.cwd()` and `STORAGE_PATH` (default `storage`).
     */
    static resolvedPath(...segments: string[]): string;
    static ensureDirectories(subdirs: string[]): Promise<void>;
}
/** Singleton-style facade (same as Storage static methods). */
export declare const storage: {
    disk: (name?: string) => FilesystemAdapter;
    path: (...segments: string[]) => string;
    resolvedPath: (...segments: string[]) => string;
    ensureDirectories: (subdirs: string[]) => Promise<void>;
};
//# sourceMappingURL=Storage.d.ts.map