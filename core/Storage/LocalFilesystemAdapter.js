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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFilesystemAdapter = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const sanitizePath_1 = require("./sanitizePath");
class LocalFilesystemAdapter {
    constructor(root) {
        this.root = root;
    }
    path(...segments) {
        const rel = segments.length ? (0, sanitizePath_1.sanitizeRelativePath)(segments) : '';
        const abs = path.join(this.root, rel);
        const resolved = path.resolve(abs);
        const rootResolved = path.resolve(this.root);
        const relativeToRoot = path.relative(rootResolved, resolved);
        if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
            throw new Error(`Path escapes storage root: ${segments.join('/')}`);
        }
        return resolved;
    }
    async exists(relativePath) {
        try {
            await fs.access(this.path(relativePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async get(relativePath) {
        return fs.readFile(this.path(relativePath));
    }
    async read(relativePath) {
        return this.get(relativePath);
    }
    async put(relativePath, contents) {
        const abs = this.path(relativePath);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, contents);
    }
    async write(relativePath, contents) {
        return this.put(relativePath, contents);
    }
    async delete(relativePath) {
        await fs.unlink(this.path(relativePath));
    }
    async mkdir(relativePath, options) {
        await fs.mkdir(this.path(relativePath), { recursive: options?.recursive ?? true });
    }
    async list(relativePath) {
        return fs.readdir(this.path(relativePath));
    }
    async isDirectory(relativePath) {
        try {
            const st = await fs.stat(this.path(relativePath));
            return st.isDirectory();
        }
        catch {
            return false;
        }
    }
}
exports.LocalFilesystemAdapter = LocalFilesystemAdapter;
//# sourceMappingURL=LocalFilesystemAdapter.js.map