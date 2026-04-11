import * as path from 'path';

/**
 * Join relative segments and reject path traversal.
 * Returns a normalized path relative to the disk root (no leading slash).
 */
export function sanitizeRelativePath(segments: string[]): string {
  const joined = path.posix.join(...segments.map((s) => s.replace(/\\/g, '/')));
  const normalized = path.posix.normalize(joined);
  if (normalized.startsWith('..') || normalized.includes('/../') || normalized === '..') {
    throw new Error(`Invalid storage path: ${segments.join('/')}`);
  }
  return normalized.replace(/^\/+/, '');
}
