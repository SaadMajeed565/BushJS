import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';

export class MakeControllerCommand extends Command {
  signature = 'make:controller';
  description = 'Create a new HTTP controller class in the configured controllers directory.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a controller name.');
      return;
    }

    const controllerPath = path.resolve(this.app.basePath, config.structure.controllers, `${name}.ts`);
    await fs.mkdir(path.dirname(controllerPath), { recursive: true });

    const stubsPath = path.join(this.app.basePath, 'src', 'stubs');
    let controllerStub = await fs.readFile(path.join(stubsPath, 'controller.stub'), 'utf-8');
    controllerStub = controllerStub.replace(/{{class}}/g, name);

    await fs.writeFile(controllerPath, controllerStub);
    console.log(`Controller created at ${controllerPath}`);
  }
}