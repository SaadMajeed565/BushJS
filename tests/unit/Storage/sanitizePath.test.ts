import { sanitizeRelativePath } from '../../../src/Storage/sanitizePath';

describe('sanitizeRelativePath', () => {
  it('returns normalized path for simple segments', () => {
    expect(sanitizeRelativePath(['file.txt'])).toBe('file.txt');
    expect(sanitizeRelativePath(['dir', 'file.txt'])).toBe('dir/file.txt');
  });

  it('strips leading slashes', () => {
    expect(sanitizeRelativePath(['/', 'etc', 'passwd'])).toBe('etc/passwd');
  });

  it('converts backslashes to forward slashes', () => {
    expect(sanitizeRelativePath(['dir\\file.txt'])).toBe('dir/file.txt');
  });

  it('rejects path traversal with ..', () => {
    expect(() => sanitizeRelativePath(['..', 'secret.txt'])).toThrow(/invalid storage path/i);
    expect(() => sanitizeRelativePath(['subdir', '..', '..', 'secret.txt'])).toThrow(/invalid storage path/i);
    expect(() => sanitizeRelativePath(['..'])).toThrow(/invalid storage path/i);
  });

  it('allows traversals that stay within relative root', () => {
    // 'a/../b' normalizes to 'b' — no traversal
    expect(sanitizeRelativePath(['a', '..', 'b'])).toBe('b');
  });

  it('handles empty segments array', () => {
    // path.posix.join() returns '.' for empty input
    expect(sanitizeRelativePath([])).toBe('.');
  });
});
