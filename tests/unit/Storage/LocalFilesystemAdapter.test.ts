import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { LocalFilesystemAdapter } from '../../../src/Storage/LocalFilesystemAdapter';

let tmpRoot: string;
let adapter: LocalFilesystemAdapter;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bush-test-'));
  adapter = new LocalFilesystemAdapter(tmpRoot);
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe('LocalFilesystemAdapter', () => {
  describe('path', () => {
    it('resolves relative path to absolute', () => {
      const result = adapter.path('test.txt');
      expect(result).toBe(path.join(tmpRoot, 'test.txt'));
    });

    it('rejects path traversal', () => {
      expect(() => adapter.path('..', 'secret.txt')).toThrow(/invalid storage path/i);
    });
  });

  describe('put and get', () => {
    it('writes and reads a file', async () => {
      await adapter.put('hello.txt', 'Hello World');
      const content = await adapter.get('hello.txt');
      expect(content.toString()).toBe('Hello World');
    });

    it('creates intermediate directories', async () => {
      await adapter.put('nested/deep/file.txt', 'data');
      const exists = await adapter.exists('nested/deep/file.txt');
      expect(exists).toBe(true);
    });
  });

  describe('write (alias for put)', () => {
    it('writes buffer contents', async () => {
      await adapter.write('data.bin', Buffer.from([0, 1, 2]));
      const content = await adapter.read('data.bin');
      expect(Buffer.from(content)).toEqual(Buffer.from([0, 1, 2]));
    });
  });

  describe('exists', () => {
    it('returns true for existing files', async () => {
      await adapter.put('existent.txt', 'content');
      expect(await adapter.exists('existent.txt')).toBe(true);
    });

    it('returns false for non-existent files', async () => {
      expect(await adapter.exists('nonexistent.txt')).toBe(false);
    });
  });

  describe('delete', () => {
    it('deletes an existing file', async () => {
      await adapter.put('todelete.txt', 'temp');
      await adapter.delete('todelete.txt');
      expect(await adapter.exists('todelete.txt')).toBe(false);
    });
  });

  describe('mkdir', () => {
    it('creates a directory', async () => {
      await adapter.mkdir('newdir');
      const stat = await fs.stat(path.join(tmpRoot, 'newdir'));
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('list', () => {
    it('lists files in a directory', async () => {
      await adapter.put('a.txt', 'a');
      await adapter.put('b.txt', 'b');
      const entries = await adapter.list('');
      expect(entries).toContain('a.txt');
      expect(entries).toContain('b.txt');
    });
  });

  describe('isDirectory', () => {
    it('returns true for directories', async () => {
      await adapter.mkdir('subdir');
      expect(await adapter.isDirectory('subdir')).toBe(true);
    });

    it('returns false for files', async () => {
      await adapter.put('file.txt', '');
      expect(await adapter.isDirectory('file.txt')).toBe(false);
    });

    it('returns false for non-existent paths', async () => {
      expect(await adapter.isDirectory('nowhere')).toBe(false);
    });
  });
});
