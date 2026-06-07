import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';

export class MakeModelCommand extends Command {
  signature = 'make:model';
  description = 'Create a new model class in the configured models directory.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a model name.');
      return;
    }

    const modelPath = path.resolve(this.app.basePath, config.structure.models, `${name}.ts`);
    await fs.mkdir(path.dirname(modelPath), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');
    let modelStub = await fs.readFile(path.join(stubsPath, 'model.stub'), 'utf-8');
    const tableName = name.toLowerCase() + 's'; // Simple pluralization
    modelStub = modelStub.replace(/{{class}}/g, name).replace(/{{table}}/g, tableName);

    await fs.writeFile(modelPath, modelStub);
    console.log(`Model created at ${modelPath}`);
  }
}