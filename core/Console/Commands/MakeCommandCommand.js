"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeCommandCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeCommandCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:command';
        this.description = 'Create a new console command class.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a command name.');
            return;
        }
        const commandPath = path_1.default.resolve(this.app.basePath, 'app', 'Console', 'Commands', `${name}Command.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(commandPath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let commandStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'command.stub'), 'utf-8');
        commandStub = commandStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(commandPath, commandStub);
        console.log(`Console command created at ${commandPath}`);
    }
}
exports.MakeCommandCommand = MakeCommandCommand;
//# sourceMappingURL=MakeCommandCommand.js.map