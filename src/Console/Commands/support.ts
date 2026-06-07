import fs from 'fs/promises';
import path from 'path';

function parsePathArg(args: string[]): string | undefined {
  const direct = args.find((arg) => arg.startsWith('--path='));
  if (direct) {
    return direct.slice('--path='.length).trim();
  }
  const idx = args.findIndex((arg) => arg === '--path');
  if (idx >= 0 && idx + 1 < args.length) {
    return args[idx + 1].trim();
  }
  return undefined;
}

export function resolveCommandDir(basePath: string, defaultRelativePath: string, args: string[]): string {
  const custom = parsePathArg(args);
  if (!custom) {
    return path.resolve(basePath, defaultRelativePath);
  }
  return path.isAbsolute(custom) ? custom : path.resolve(basePath, custom);
}

function canLoadTsFiles(): boolean {
  return Boolean((require as any).extensions?.['.ts']);
}

export async function collectRunnableFiles(directories: string[]): Promise<string[]> {
  const allowTs = canLoadTsFiles();
  const files = new Set<string>();

  for (const dir of directories) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (entry.endsWith('.js') || (allowTs && entry.endsWith('.ts'))) {
          files.add(path.join(dir, entry));
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return Array.from(files).sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

export function loadCommandClass(filePath: string): any {
  const mod = require(filePath);
  return mod.default ?? mod[Object.keys(mod)[0]];
}
