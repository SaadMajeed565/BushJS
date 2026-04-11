"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeRequestCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeRequestCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:request';
        this.description = 'Create a new form request class.';
        this.app = app;
    }
    async handle(args) {
        const rawName = args[0];
        if (!rawName) {
            console.log('Please provide a request name.');
            return;
        }
        const name = rawName.endsWith('Request') ? rawName : `${rawName}Request`;
        const requestPath = path_1.default.resolve(this.app.basePath, 'app', 'Http', 'Requests', `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(requestPath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let requestStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'request.stub'), 'utf-8');
        requestStub = requestStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(requestPath, requestStub);
        console.log(`Form request created at ${requestPath}`);
    }
}
exports.MakeRequestCommand = MakeRequestCommand;
//# sourceMappingURL=MakeRequestCommand.js.map