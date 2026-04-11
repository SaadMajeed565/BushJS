"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeSchemaCommand = void 0;
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
class MakeSchemaCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:schema';
        this.description = 'Create a new database schema file.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a schema name.');
            return;
        }
        const timestamp = new Date()
            .toISOString()
            .replace(/[-:T.]/g, '')
            .slice(0, 14);
        const normalized = normalizeName(name);
        const fileName = `${timestamp}_${normalized}.ts`;
        const schemasPath = path_1.default.resolve(this.app.basePath, 'database', 'schemas');
        await promises_1.default.mkdir(schemasPath, { recursive: true });
        const className = `${toPascalCase(name)}Schema`;
        const tableName = normalized.endsWith('s') ? normalized : `${normalized}s`;
        const stubPath = path_1.default.resolve(__dirname, '../stubs/schema.stub');
        let stub = await promises_1.default.readFile(stubPath, 'utf-8');
        stub = stub.replace(/{{class}}/g, className).replace(/{{table}}/g, tableName);
        await promises_1.default.writeFile(path_1.default.join(schemasPath, fileName), stub);
        console.log(`Schema created at database/schemas/${fileName}`);
    }
}
exports.MakeSchemaCommand = MakeSchemaCommand;
//# sourceMappingURL=MakeSchemaCommand.js.map