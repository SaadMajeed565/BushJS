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
exports.SeedCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class SeedCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'seed';
        this.description = 'Run database seeders.';
        this.app = app;
    }
    async handle() {
        const seedersPath = path_1.default.resolve(this.app.basePath, 'database', 'seeds');
        try {
            const files = await promises_1.default.readdir(seedersPath);
            const seederFiles = files.filter((name) => name.endsWith('.ts') || name.endsWith('.js')).sort();
            if (seederFiles.length === 0) {
                console.log('No seeders found.');
                return;
            }
            console.log('Running seeders...');
            for (const file of seederFiles) {
                const filePath = path_1.default.resolve(seedersPath, file);
                const module = await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)));
                const SeederClass = module.default ?? module[Object.keys(module)[0]];
                if (!SeederClass) {
                    console.warn(`Skipping seeder ${file}: no default export found.`);
                    continue;
                }
                const seeder = new SeederClass();
                if (typeof seeder.run !== 'function') {
                    console.warn(`Skipping seeder ${file}: missing run() method.`);
                    continue;
                }
                await seeder.run();
                console.log(`Seeded: ${file}`);
            }
            console.log('Seeders completed successfully.');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                console.log('database/seeds directory does not exist.');
                return;
            }
            throw error;
        }
    }
}
exports.SeedCommand = SeedCommand;
//# sourceMappingURL=SeedCommand.js.map