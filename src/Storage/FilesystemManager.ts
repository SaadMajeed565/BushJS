import * as path from 'path';
import type { FilesystemsConfig } from '../Config/Config';
import type { FilesystemAdapter } from './FilesystemAdapter';
import { LocalFilesystemAdapter } from './LocalFilesystemAdapter';

export class FilesystemManager {
  private readonly disks = new Map<string, FilesystemAdapter>();

  constructor(
    private readonly basePath: string,
    private readonly config: FilesystemsConfig
  ) {
    const localRoot = path.join(basePath, config.disks.local.root);
    this.disks.set('local', new LocalFilesystemAdapter(localRoot));
  }

  disk(name?: string): FilesystemAdapter {
    const diskName = name ?? this.config.default;
    const adapter = this.disks.get(diskName);
    if (!adapter) {
      throw new Error(`Filesystem disk [${diskName}] is not configured.`);
    }
    return adapter;
  }

  /** Absolute path on the default disk. */
  path(...segments: string[]): string {
    return this.disk().path(...segments);
  }

  async ensureDirectories(subdirs: string[]): Promise<void> {
    const d = this.disk();
    for (const sub of subdirs) {
      await d.mkdir(sub, { recursive: true });
    }
  }
}
