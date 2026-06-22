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

function isTsNodeRegistered(): boolean {
  return !!(process as any)[Symbol.for('ts-node.register.instance')] ||
         process.execArgv.some(arg => arg.includes('ts-node') || arg.includes('tsx'));
}

export async function collectRunnableFiles(directories: string[]): Promise<string[]> {
  const files = new Set<string>();

  for (const dir of directories) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (entry.endsWith('.js') || (entry.endsWith('.ts') && isTsNodeRegistered())) {
          files.add(path.join(dir, entry));
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  return Array.from(files).sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

export async function loadCommandClass<T = any>(filePath: string): Promise<T | null> {
  try {
    const mod = await import(filePath);
    return (mod.default ?? Object.values(mod)[0]) as T;
  } catch {
    return null;
  }
}
