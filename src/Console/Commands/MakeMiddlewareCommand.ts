import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class MakeMiddlewareCommand extends Command {
  signature = 'make:middleware';
  description = 'Create a new middleware class.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a middleware name.');
      return;
    }

    const middlewarePath = path.resolve(this.app.basePath, 'app', 'Http', 'Middleware', `${name}.ts`);
    await fs.mkdir(path.dirname(middlewarePath), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');
    let middlewareStub = await fs.readFile(path.join(stubsPath, 'middleware.stub'), 'utf-8');
    middlewareStub = middlewareStub.replace(/{{class}}/g, name);

    await fs.writeFile(middlewarePath, middlewareStub);
    console.log(`Middleware created at ${middlewarePath}`);
  }
}
