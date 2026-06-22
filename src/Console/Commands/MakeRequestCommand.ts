import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';

export class MakeRequestCommand extends Command {
  signature = 'make:request';
  description = 'Create a new form request class in the configured requests directory.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const rawName = args[0];
    if (!rawName) {
      console.log('Please provide a request name.');
      return;
    }

    const name = rawName.endsWith('Request') ? rawName : `${rawName}Request`;
    const requestPath = path.resolve(this.app.basePath, config.structure.requests, `${name}.ts`);
    await fs.mkdir(path.dirname(requestPath), { recursive: true });

    const stubsPath = path.join(this.app.basePath, 'src', 'stubs');
    let requestStub = await fs.readFile(path.join(stubsPath, 'request.stub'), 'utf-8');
    requestStub = requestStub.replace(/{{class}}/g, name);

    await fs.writeFile(requestPath, requestStub);
    console.log(`Form request created at ${requestPath}`);
  }
}
