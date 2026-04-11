import * as path from 'path';
import type { FilesystemsConfig } from '../Config/Config';
import type { FilesystemAdapter } from './FilesystemAdapter';
import { FilesystemManager } from './FilesystemManager';

let manager: FilesystemManager | null = null;

export class Storage {
  static init(basePath: string, filesystems: FilesystemsConfig): void {
    manager = new FilesystemManager(basePath, filesystems);
  }

  static bind(instance: FilesystemManager): void {
    manager = instance;
  }

  static getManager(): FilesystemManager | null {
    return manager;
  }

  static disk(name?: string): FilesystemAdapter {
    const m = manager;
    if (!m) {
      throw new Error('Storage has not been initialized. Ensure Application is booted.');
    }
    return m.disk(name);
  }

  static path(...segments: string[]): string {
    const m = manager;
    if (!m) {
      throw new Error('Storage has not been initialized. Ensure Application is booted.');
    }
    return m.path(...segments);
  }

  /**
   * Absolute path under the configured storage root. Works before `Storage.init` using
   * `process.cwd()` and `STORAGE_PATH` (default `storage`).
   */
  static resolvedPath(...segments: string[]): string {
    if (manager) {
      return segments.length ? manager.path(...segments) : manager.path();
    }
    const root = path.join(process.cwd(), process.env.STORAGE_PATH || 'storage');
    return segments.length ? path.join(root, ...segments) : root;
  }

  static async ensureDirectories(subdirs: string[]): Promise<void> {
    const m = manager;
    if (!m) {
      throw new Error('Storage has not been initialized. Ensure Application is booted.');
    }
    return m.ensureDirectories(subdirs);
  }
}

/** Singleton-style facade (same as Storage static methods). */
export const storage = {
  disk: (name?: string) => Storage.disk(name),
  path: (...segments: string[]) => Storage.path(...segments),
  resolvedPath: (...segments: string[]) => Storage.resolvedPath(...segments),
  ensureDirectories: (subdirs: string[]) => Storage.ensureDirectories(subdirs)
};
