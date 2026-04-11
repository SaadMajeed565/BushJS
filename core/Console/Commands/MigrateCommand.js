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
exports.MigrateCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MigrateCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'schema';
        this.description = 'Run database schema files';
        this.app = app;
    }
    async handle(args) {
        const rollback = args.includes('--rollback');
        const schemaDirs = [
            path_1.default.resolve(this.app.basePath, 'database', 'schemas'),
            path_1.default.resolve(this.app.basePath, 'database', 'migrations'),
        ];
        const schemaFiles = new Set();
        try {
            for (const dir of schemaDirs) {
                try {
                    const files = await promises_1.default.readdir(dir);
                    files
                        .filter((name) => name.endsWith('.ts') || name.endsWith('.js'))
                        .forEach((file) => schemaFiles.add(path_1.default.join(dir, file)));
                }
                catch (error) {
                    if (error.code !== 'ENOENT') {
                        throw error;
                    }
                }
            }
            if (schemaFiles.size === 0) {
                console.log('No schema files found.');
                return;
            }
            const sortedFiles = Array.from(schemaFiles).sort((a, b) => path_1.default.basename(a).localeCompare(path_1.default.basename(b)));
            if (rollback) {
                console.log('Rolling back schema files...');
                for (let i = sortedFiles.length - 1; i >= 0; i--) {
                    const filePath = sortedFiles[i];
                    const file = path_1.default.basename(filePath);
                    const module = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
                    const SchemaClass = module.default ?? module[Object.keys(module)[0]];
                    if (!SchemaClass) {
                        console.warn(`Skipping schema file ${file}: no default export found.`);
                        continue;
                    }
                    const schema = new SchemaClass();
                    if (typeof schema.down !== 'function') {
                        console.warn(`Skipping schema file ${file}: missing down() method.`);
                        continue;
                    }
                    await schema.down();
                    console.log(`Rolled back: ${file}`);
                }
                return;
            }
            console.log('Running schema files...');
            for (const filePath of sortedFiles) {
                const file = path_1.default.basename(filePath);
                const module = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
                const SchemaClass = module.default ?? module[Object.keys(module)[0]];
                if (!SchemaClass) {
                    console.warn(`Skipping schema file ${file}: no default export found.`);
                    continue;
                }
                const schema = new SchemaClass();
                if (typeof schema.up !== 'function') {
                    console.warn(`Skipping schema file ${file}: missing up() method.`);
                    continue;
                }
                await schema.up();
                console.log(`Applied schema file: ${file}`);
            }
            console.log('Schema files completed successfully.');
        }
        catch (error) {
            throw error;
        }
    }
}
exports.MigrateCommand = MigrateCommand;
//# sourceMappingURL=MigrateCommand.js.map