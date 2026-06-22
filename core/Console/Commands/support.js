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
exports.resolveCommandDir = resolveCommandDir;
exports.collectRunnableFiles = collectRunnableFiles;
exports.loadCommandClass = loadCommandClass;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
function parsePathArg(args) {
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
function resolveCommandDir(basePath, defaultRelativePath, args) {
    const custom = parsePathArg(args);
    if (!custom) {
        return path_1.default.resolve(basePath, defaultRelativePath);
    }
    return path_1.default.isAbsolute(custom) ? custom : path_1.default.resolve(basePath, custom);
}
function isTsNodeRegistered() {
    return !!process[Symbol.for('ts-node.register.instance')] ||
        process.execArgv.some(arg => arg.includes('ts-node') || arg.includes('tsx'));
}
async function collectRunnableFiles(directories) {
    const files = new Set();
    for (const dir of directories) {
        try {
            const entries = await promises_1.default.readdir(dir);
            for (const entry of entries) {
                if (entry.endsWith('.js') || (entry.endsWith('.ts') && isTsNodeRegistered())) {
                    files.add(path_1.default.join(dir, entry));
                }
            }
        }
        catch (error) {
            if (error instanceof Error && error.code === 'ENOENT') {
                continue;
            }
            throw error;
        }
    }
    return Array.from(files).sort((a, b) => path_1.default.basename(a).localeCompare(path_1.default.basename(b)));
}
async function loadCommandClass(filePath) {
    try {
        const mod = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
        return (mod.default ?? Object.values(mod)[0]);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=support.js.map