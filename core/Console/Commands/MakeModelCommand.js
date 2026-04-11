"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeModelCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeModelCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:model';
        this.description = 'Create a new model class.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a model name.');
            return;
        }
        const modelPath = path_1.default.resolve(this.app.basePath, 'app', 'Models', `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(modelPath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let modelStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'model.stub'), 'utf-8');
        const tableName = name.toLowerCase() + 's'; // Simple pluralization
        modelStub = modelStub.replace(/{{class}}/g, name).replace(/{{table}}/g, tableName);
        await promises_1.default.writeFile(modelPath, modelStub);
        console.log(`Model created at ${modelPath}`);
    }
}
exports.MakeModelCommand = MakeModelCommand;
//# sourceMappingURL=MakeModelCommand.js.map