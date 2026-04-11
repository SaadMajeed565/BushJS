"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moduleAlias = __importStar(require("module-alias"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ext = __filename.endsWith('.ts') ? '.ts' : '.js';
const basePath = process.cwd();
// Detect if we're running from standalone dist (app layout) vs TypeScript source
const isStandaloneDist = fs_1.default.existsSync(path_1.default.join(basePath, 'src')) &&
    fs_1.default.existsSync(path_1.default.join(basePath, 'app')) &&
    !fs_1.default.existsSync(path_1.default.join(basePath, 'tsconfig.json'));
const srcPath = isStandaloneDist
    ? path_1.default.join(basePath, 'src')
    : (ext === '.js' ? path_1.default.join(basePath, 'dist', 'src') : path_1.default.join(basePath, 'src'));
const appPath = isStandaloneDist
    ? path_1.default.join(basePath, 'app')
    : (ext === '.js' ? path_1.default.join(basePath, 'dist', 'app') : path_1.default.join(basePath, 'app'));
const routesPath = isStandaloneDist
    ? path_1.default.join(basePath, 'routes')
    : (ext === '.js' ? path_1.default.join(basePath, 'dist', 'routes') : path_1.default.join(basePath, 'routes'));
const configPath = isStandaloneDist
    ? path_1.default.join(basePath, 'config')
    : (ext === '.js' ? path_1.default.join(basePath, 'dist', 'config') : path_1.default.join(basePath, 'config'));
const databasePath = isStandaloneDist
    ? path_1.default.join(basePath, 'database')
    : (ext === '.js' ? path_1.default.join(basePath, 'dist', 'database') : path_1.default.join(basePath, 'database'));
moduleAlias.addAliases({
    '@framework': path_1.default.join(srcPath, `bush${ext}`),
    '@framework/Http': path_1.default.join(srcPath, 'Http'),
    '@framework/Database': path_1.default.join(srcPath, 'Database'),
    '@framework/Foundation': path_1.default.join(srcPath, 'Foundation'),
    '@framework/Console': path_1.default.join(srcPath, 'Console'),
    '@framework/Contracts': path_1.default.join(srcPath, 'Contracts'),
    '@framework/Validation': path_1.default.join(srcPath, 'Validation'),
    '@framework/Auth': path_1.default.join(srcPath, 'Auth'),
    '@app': appPath,
    '@app/Http': path_1.default.join(appPath, 'Http'),
    '@app/Models': path_1.default.join(appPath, 'Models'),
    '@app/GraphQL': path_1.default.join(appPath, 'GraphQL'),
    '@app/WebSockets': path_1.default.join(appPath, 'WebSockets'),
    '@routes': routesPath,
    '@config': configPath,
    '@database': databasePath,
});
//# sourceMappingURL=register-aliases.js.map