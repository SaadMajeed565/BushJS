"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeAppCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeAppCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:app';
        this.description = 'Scaffold a new application folder with controllers, models, and routes.';
        this.app = app;
    }
    async handle(args) {
        const targetName = args[0] ?? 'app';
        const targetPath = path_1.default.resolve(this.app.basePath, targetName);
        await promises_1.default.mkdir(path_1.default.join(targetPath, 'Http', 'Controllers'), { recursive: true });
        await promises_1.default.mkdir(path_1.default.join(targetPath, 'Models'), { recursive: true });
        await promises_1.default.mkdir(path_1.default.join(targetPath, 'routes'), { recursive: true });
        const stubsPath = path_1.default.join(this.app.basePath, 'src', 'stubs');
        let controllerStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'controller.stub'), 'utf-8');
        controllerStub = controllerStub.replace(/{{class}}/g, 'WelcomeController');
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'Http', 'Controllers', 'WelcomeController.ts'), controllerStub);
        let modelStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'model.stub'), 'utf-8');
        modelStub = modelStub.replace(/{{class}}/g, 'User').replace(/{{table}}/g, 'users');
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'Models', 'User.ts'), modelStub);
        const routeStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'route.stub'), 'utf-8');
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'routes', 'api.ts'), routeStub);
        console.log(`Application scaffold created at ${targetPath}`);
    }
}
exports.MakeAppCommand = MakeAppCommand;
//# sourceMappingURL=MakeAppCommand.js.map