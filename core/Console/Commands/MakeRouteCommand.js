"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeRouteCommand = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Command_1 = require("../Command");
class MakeRouteCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'make:route';
        this.description = 'Create a new route registration file.';
        this.app = app;
    }
    async handle(args) {
        const name = args[0];
        if (!name) {
            console.log('Please provide a route file name.');
            return;
        }
        const routePath = path_1.default.resolve(this.app.basePath, 'routes', `${name}.ts`);
        await promises_1.default.mkdir(path_1.default.dirname(routePath), { recursive: true });
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        let routeStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'route.stub'), 'utf-8');
        await promises_1.default.writeFile(routePath, routeStub);
        console.log(`Route file created at ${routePath}`);
    }
}
exports.MakeRouteCommand = MakeRouteCommand;
//# sourceMappingURL=MakeRouteCommand.js.map