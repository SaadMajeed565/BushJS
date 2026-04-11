"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeMiddlewareCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeMiddlewareCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:middleware';
        this.description = 'Create a new middleware class.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a middleware name.');
            return;
        }
        const middlewarePath = path_1.default.resolve(this.app.basePath, 'app', 'Http', 'Middleware', `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(middlewarePath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let middlewareStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'middleware.stub'), 'utf-8');
        middlewareStub = middlewareStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(middlewarePath, middlewareStub);
        console.log(`Middleware created at ${middlewarePath}`);
    }
}
exports.MakeMiddlewareCommand = MakeMiddlewareCommand;
//# sourceMappingURL=MakeMiddlewareCommand.js.map