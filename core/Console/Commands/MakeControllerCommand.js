"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeControllerCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeControllerCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:controller';
        this.description = 'Create a new controller class.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a controller name.');
            return;
        }
        const controllerPath = path_1.default.resolve(this.app.basePath, 'app', 'Http', 'Controllers', `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(controllerPath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let controllerStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'controller.stub'), 'utf-8');
        controllerStub = controllerStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(controllerPath, controllerStub);
        console.log(`Controller created at ${controllerPath}`);
    }
}
exports.MakeControllerCommand = MakeControllerCommand;
//# sourceMappingURL=MakeControllerCommand.js.map