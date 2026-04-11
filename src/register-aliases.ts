import * as moduleAlias from 'module-alias';
import path from 'path';
import fs from 'fs';

const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
const basePath = process.cwd();

// Detect if we're running from standalone dist (app layout) vs TypeScript source
const isStandaloneDist = fs.existsSync(path.join(basePath, 'src')) &&
                        fs.existsSync(path.join(basePath, 'app')) &&
                        !fs.existsSync(path.join(basePath, 'tsconfig.json'));

const srcPath = isStandaloneDist
  ? path.join(basePath, 'src')
  : (ext === '.js' ? path.join(basePath, 'dist', 'src') : path.join(basePath, 'src'));

const appPath = isStandaloneDist
  ? path.join(basePath, 'app')
  : (ext === '.js' ? path.join(basePath, 'dist', 'app') : path.join(basePath, 'app'));

const routesPath = isStandaloneDist
  ? path.join(basePath, 'routes')
  : (ext === '.js' ? path.join(basePath, 'dist', 'routes') : path.join(basePath, 'routes'));

const configPath = isStandaloneDist
  ? path.join(basePath, 'config')
  : (ext === '.js' ? path.join(basePath, 'dist', 'config') : path.join(basePath, 'config'));

const databasePath = isStandaloneDist
  ? path.join(basePath, 'database')
  : (ext === '.js' ? path.join(basePath, 'dist', 'database') : path.join(basePath, 'database'));

moduleAlias.addAliases({
  '@framework': path.join(srcPath, `bush${ext}`),
  '@framework/Http': path.join(srcPath, 'Http'),
  '@framework/Database': path.join(srcPath, 'Database'),
  '@framework/Foundation': path.join(srcPath, 'Foundation'),
  '@framework/Console': path.join(srcPath, 'Console'),
  '@framework/Contracts': path.join(srcPath, 'Contracts'),
  '@framework/Validation': path.join(srcPath, 'Validation'),
  '@framework/Auth': path.join(srcPath, 'Auth'),
  '@app': appPath,
  '@app/Http': path.join(appPath, 'Http'),
  '@app/Models': path.join(appPath, 'Models'),
  '@app/GraphQL': path.join(appPath, 'GraphQL'),
  '@app/WebSockets': path.join(appPath, 'WebSockets'),
  '@routes': routesPath,
  '@config': configPath,
  '@database': databasePath,
});

export {};