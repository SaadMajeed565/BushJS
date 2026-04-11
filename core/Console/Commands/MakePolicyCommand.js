"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakePolicyCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakePolicyCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:policy';
        this.description = 'Create a new policy class.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a policy name.');
            return;
        }
        const policyPath = path_1.default.resolve(this.app.basePath, 'app', 'Policies', `${name}Policy.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(policyPath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let policyStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'policy.stub'), 'utf-8');
        policyStub = policyStub.replace(/{{class}}/g, name);
        await promises_1.default.writeFile(policyPath, policyStub);
        console.log(`Policy created at ${policyPath}`);
    }
}
exports.MakePolicyCommand = MakePolicyCommand;
//# sourceMappingURL=MakePolicyCommand.js.map