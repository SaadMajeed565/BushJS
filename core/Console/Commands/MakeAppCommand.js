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
        const stubsPath = path_1.default.resolve(__dirname, '../stubs');
        // Controller
        let controllerStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'controller.stub'), 'utf-8');
        controllerStub = controllerStub.replace(/{{class}}/g, 'WelcomeController');
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'Http', 'Controllers', 'WelcomeController.ts'), controllerStub);
        // Model
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'Models', 'User.ts'), `import { Model } from '@framework/Database/Model';
import mongoose, { Schema } from 'mongoose';

export class User extends Model {
  static collection = 'users';

  static initialize(): void {
    this.schema = new Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    });

    super.initialize();
  }

  static async findByEmail(email: string): Promise<any> {
    return await this.where('email', email).first();
  }
}
`);
        // Route
        const routeStub = await promises_1.default.readFile(path_1.default.join(stubsPath, 'route.stub'), 'utf-8');
        await promises_1.default.writeFile(path_1.default.join(targetPath, 'routes', 'api.ts'), routeStub);
        console.log(`Application scaffold created at ${targetPath}`);
    }
}
exports.MakeAppCommand = MakeAppCommand;
//# sourceMappingURL=MakeAppCommand.js.map