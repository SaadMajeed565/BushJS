import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class MakeAppCommand extends Command {
  signature = 'make:app';
  description = 'Scaffold a new application folder with controllers, models, and routes.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const targetName = args[0] ?? 'app';
    const targetPath = path.resolve(this.app.basePath, targetName);

    await fs.mkdir(path.join(targetPath, 'Http', 'Controllers'), { recursive: true });
    await fs.mkdir(path.join(targetPath, 'Models'), { recursive: true });
    await fs.mkdir(path.join(targetPath, 'routes'), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');

    // Controller
    let controllerStub = await fs.readFile(path.join(stubsPath, 'controller.stub'), 'utf-8');
    controllerStub = controllerStub.replace(/{{class}}/g, 'WelcomeController');
    await fs.writeFile(
      path.join(targetPath, 'Http', 'Controllers', 'WelcomeController.ts'),
      controllerStub
    );

    // Model
    await fs.writeFile(
      path.join(targetPath, 'Models', 'User.ts'),
      `import { Model } from '@framework/Database/Model';
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
`
    );

    // Route
    const routeStub = await fs.readFile(path.join(stubsPath, 'route.stub'), 'utf-8');
    await fs.writeFile(
      path.join(targetPath, 'routes', 'api.ts'),
      routeStub
    );

    console.log(`Application scaffold created at ${targetPath}`);
  }
}
