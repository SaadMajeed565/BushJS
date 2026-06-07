import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';

export class MakeCommandCommand extends Command {
  signature = 'make:command';
  description = 'Create a new console command class in the configured commands directory.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a command name.');
      return;
    }

    const commandPath = path.resolve(this.app.basePath, config.structure.commands, `${name}Command.ts`);
    await fs.mkdir(path.dirname(commandPath), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');
    let commandStub = await fs.readFile(path.join(stubsPath, 'command.stub'), 'utf-8');
    commandStub = commandStub.replace(/{{class}}/g, name);

    await fs.writeFile(commandPath, commandStub);
    console.log(`Console command created at ${commandPath}`);
  }
}
