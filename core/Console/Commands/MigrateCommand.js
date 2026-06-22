"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateCommand = void 0;
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
const Config_1 = require("../../Config/Config");
const support_1 = require("./support");
class MigrateCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'migrate';
        this.description = 'Run database migrations/schemas (supports --path and --rollback).';
        this.app = app;
    }
    async handle(args) {
        const rollback = args.includes('--rollback');
        const defaultSchemaDir = (0, support_1.resolveCommandDir)(this.app.basePath, Config_1.config.structure.schemas, args);
        const migrationDir = path_1.default.resolve(this.app.basePath, 'database', 'migrations');
        try {
            const schemaFiles = await (0, support_1.collectRunnableFiles)([defaultSchemaDir, migrationDir]);
            if (schemaFiles.length === 0) {
                console.log('No schema files found.');
                return;
            }
            if (rollback) {
                console.log('Rolling back schema files...');
                for (let i = schemaFiles.length - 1; i >= 0; i--) {
                    const filePath = schemaFiles[i];
                    const file = path_1.default.basename(filePath);
                    const SchemaClass = await (0, support_1.loadCommandClass)(filePath);
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
            for (const filePath of schemaFiles) {
                const file = path_1.default.basename(filePath);
                const SchemaClass = await (0, support_1.loadCommandClass)(filePath);
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