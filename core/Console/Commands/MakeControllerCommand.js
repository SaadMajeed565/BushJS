"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeControllerCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
const Config_1 = require("../../Config/Config");
class MakeControllerCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:controller';
        this.description = 'Create a new HTTP controller class in the configured controllers directory.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a controller name.');
            return;
        }
        const controllerPath = path_1.default.resolve(this.app.basePath, Config_1.config.structure.controllers, `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(controllerPath), { recursive: true });
        const stubsPath = path_1.default.join(this.app.basePath, 'src', 'stubs');
        let controllerStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'controller.stub'), 'utf-8');
        controllerStub = controllerStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(controllerPath, controllerStub);
        console.log(`Controller created at ${controllerPath}`);
    }
}
exports.MakeControllerCommand = MakeControllerCommand;
//# sourceMappingURL=MakeControllerCommand.js.map