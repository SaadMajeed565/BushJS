import type { FilesystemAdapter } from './FilesystemAdapter';
export declare class LocalFilesystemAdapter implements FilesystemAdapter {
    private readonly root;
    constructor(root: string);
    path(...segments: string[]): string;
    exists(relativePath: string): Promise<boolean>;
    get(relativePath: string): Promise<Buffer>;
    read(relativePath: string): Promise<Buffer>;
    put(relativePath: string, contents: Buffer | string): Promise<void>;
    write(relativePath: string, contents: Buffer | string): Promise<void>;
    delete(relativePath: string): Promise<void>;
    mkdir(relativePath: string, options?: {
        recursive?: boolean;
    }): Promise<void>;
    list(relativePath: string): Promise<string[]>;
    isDirectory(relativePath: string): Promise<boolean>;
}
//# sourceMappingURL=LocalFilesystemAdapter.d.ts.map