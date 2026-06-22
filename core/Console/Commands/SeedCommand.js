"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedCommand = void 0;
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
const Config_1 = require("../../Config/Config");
const support_1 = require("./support");
class SeedCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'seed';
        this.description = 'Run database seeders (CommonJS-first; supports --path override).';
        this.app = app;
    }
    async handle(args) {
        const seedersPath = (0, support_1.resolveCommandDir)(this.app.basePath, Config_1.config.structure.seeders, args);
        try {
            const seederFiles = await (0, support_1.collectRunnableFiles)([seedersPath]);
            if (seederFiles.length === 0) {
                console.log(`No seeders found in ${seedersPath}.`);
                return;
            }
            console.log('Running seeders...');
            for (const filePath of seederFiles) {
                const file = path_1.default.basename(filePath);
                const SeederClass = await (0, support_1.loadCommandClass)(filePath);
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
            if (error instanceof Error && error.code === 'ENOENT') {
                console.log(`${seedersPath} does not exist.`);
                return;
            }
            throw error;
        }
    }
}
exports.SeedCommand = SeedCommand;
//# sourceMappingURL=SeedCommand.js.map