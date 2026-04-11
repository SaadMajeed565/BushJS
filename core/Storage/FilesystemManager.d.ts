import type { FilesystemsConfig } from '../Config/Config';
import type { FilesystemAdapter } from './FilesystemAdapter';
export declare class FilesystemManager {
    private readonly basePath;
    private readonly config;
    private readonly disks;
    constructor(basePath: string, config: FilesystemsConfig);
    disk(name?: string): FilesystemAdapter;
    /** Absolute path on the default disk. */
    path(...segments: string[]): string;
    ensureDirectories(subdirs: string[]): Promise<void>;
}
//# sourceMappingURL=FilesystemManager.d.ts.map