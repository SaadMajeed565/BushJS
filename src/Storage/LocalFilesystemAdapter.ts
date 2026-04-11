import * as fs from 'fs/promises';
import * as path from 'path';
import type { FilesystemAdapter } from './FilesystemAdapter';
import { sanitizeRelativePath } from './sanitizePath';

export class LocalFilesystemAdapter implements FilesystemAdapter {
  constructor(private readonly root: string) {}

  path(...segments: string[]): string {
    const rel = segments.length ? sanitizeRelativePath(segments) : '';
    const abs = path.join(this.root, rel);
    const resolved = path.resolve(abs);
    const rootResolved = path.resolve(this.root);
    const relativeToRoot = path.relative(rootResolved, resolved);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      throw new Error(`Path escapes storage root: ${segments.join('/')}`);
    }
    return resolved;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.path(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async get(relativePath: string): Promise<Buffer> {
    return fs.readFile(this.path(relativePath));
  }

  async read(relativePath: string): Promise<Buffer> {
    return this.get(relativePath);
  }

  async put(relativePath: string, contents: Buffer | string): Promise<void> {
    const abs = this.path(relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, contents);
  }

  async write(relativePath: string, contents: Buffer | string): Promise<void> {
    return this.put(relativePath, contents);
  }

  async delete(relativePath: string): Promise<void> {
    await fs.unlink(this.path(relativePath));
  }

  async mkdir(relativePath: string, options?: { recursive?: boolean }): Promise<void> {
    await fs.mkdir(this.path(relativePath), { recursive: options?.recursive ?? true });
  }

  async list(relativePath: string): Promise<string[]> {
    return fs.readdir(this.path(relativePath));
  }

  async isDirectory(relativePath: string): Promise<boolean> {
    try {
      const st = await fs.stat(this.path(relativePath));
      return st.isDirectory();
    } catch {
      return false;
    }
  }
}
