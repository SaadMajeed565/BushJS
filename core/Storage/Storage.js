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
exports.storage = exports.Storage = void 0;
const path = __importStar(require("path"));
const FilesystemManager_1 = require("./FilesystemManager");
let manager = null;
class Storage {
    static init(basePath, filesystems) {
        manager = new FilesystemManager_1.FilesystemManager(basePath, filesystems);
    }
    static bind(instance) {
        manager = instance;
    }
    static getManager() {
        return manager;
    }
    static disk(name) {
        const m = manager;
        if (!m) {
            throw new Error('Storage has not been initialized. Ensure Application is booted.');
        }
        return m.disk(name);
    }
    static path(...segments) {
        const m = manager;
        if (!m) {
            throw new Error('Storage has not been initialized. Ensure Application is booted.');
        }
        return m.path(...segments);
    }
    /**
     * Absolute path under the configured storage root. Works before `Storage.init` using
     * `process.cwd()` and `STORAGE_PATH` (default `storage`).
     */
    static resolvedPath(...segments) {
        if (manager) {
            return segments.length ? manager.path(...segments) : manager.path();
        }
        const root = path.join(process.cwd(), process.env.STORAGE_PATH || 'storage');
        return segments.length ? path.join(root, ...segments) : root;
    }
    static async ensureDirectories(subdirs) {
        const m = manager;
        if (!m) {
            throw new Error('Storage has not been initialized. Ensure Application is booted.');
        }
        return m.ensureDirectories(subdirs);
    }
}
exports.Storage = Storage;
/** Singleton-style facade (same as Storage static methods). */
exports.storage = {
    disk: (name) => Storage.disk(name),
    path: (...segments) => Storage.path(...segments),
    resolvedPath: (...segments) => Storage.resolvedPath(...segments),
    ensureDirectories: (subdirs) => Storage.ensureDirectories(subdirs)
};
//# sourceMappingURL=Storage.js.map