"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeSeederCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
function toPascalCase(value) {
    return value
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join('');
}
function normalizeName(value) {
    return value.replace(/\s+/g, '_').toLowerCase();
}
class MakeSeederCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:seeder';
        this.description = 'Create a new database seeder file.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a seeder name.');
            return;
        }
        const timestamp = new Date()
            .toISOString()
            .replace(/[-:T.]/g, '')
            .slice(0, 14);
        const normalized = normalizeName(name);
        const fileName = `${timestamp}_${normalized}_seeder.ts`;
        const seedersPath = path_1.default.resolve(this.app.basePath, 'database', 'seeds');
        await promises_1.default.mkdir(seedersPath, { recursive: true });
        const className = `${toPascalCase(name)}Seeder`;
        const stubPath = path_1.default.resolve(__dirname, '../stubs/seeder.stub');
        let stub = await promises_1.default.readFile(stubPath, 'utf-8');
        stub = stub.replace(/{{class}}/g, className);
        await promises_1.default.writeFile(path_1.default.join(seedersPath, fileName), stub);
        console.log(`Seeder created at database/seeds/${fileName}`);
    }
}
exports.MakeSeederCommand = MakeSeederCommand;
//# sourceMappingURL=MakeSeederCommand.js.map