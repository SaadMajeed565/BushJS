import { Application } from '../Foundation/Application';
import { Command } from './Command';
import { MakeAppCommand } from './Commands/MakeAppCommand';
import { MakeControllerCommand } from './Commands/MakeControllerCommand';
import { MakeModelCommand } from './Commands/MakeModelCommand';
import { MakeSchemaCommand } from './Commands/MakeSchemaCommand';
import { MakeSeederCommand } from './Commands/MakeSeederCommand';
import { MakeMiddlewareCommand } from './Commands/MakeMiddlewareCommand';
import { MakeRequestCommand } from './Commands/MakeRequestCommand';
import { MakePolicyCommand } from './Commands/MakePolicyCommand';
import { MakeCommandCommand } from './Commands/MakeCommandCommand';
import { MakeRouteCommand } from './Commands/MakeRouteCommand';
import { SeedCommand } from './Commands/SeedCommand';
import { SchemaCommand } from './Commands/SchemaCommand';

export class ConsoleKernel {
  protected app: Application;
  protected commands = new Map<string, Command>();

  constructor(app: Application) {
    this.app = app;
    this.registerDefaultCommands();
  }

  register(command: Command): void {
    this.commands.set(command.signature, command);
  }

  protected registerDefaultCommands(): void {
    this.register(new MakeAppCommand(this.app));
    this.register(new MakeControllerCommand(this.app));
    this.register(new MakeModelCommand(this.app));
    this.register(new MakeSchemaCommand(this.app));
    this.register(new MakeSeederCommand(this.app));
    this.register(new MakeMiddlewareCommand(this.app));
    this.register(new MakeRequestCommand(this.app));
    this.register(new MakePolicyCommand(this.app));
    this.register(new MakeCommandCommand(this.app));
    this.register(new MakeRouteCommand(this.app));
    this.register(new SeedCommand(this.app));
    this.register(new SchemaCommand(this.app));
  }

  async handle(argv: string[] = []): Promise<void> {
    const commandName = argv[2] ?? 'help';
    const command = this.commands.get(commandName);
    const args = argv.slice(3);

    if (!command) {
      this.showHelp();
      return;
    }

    await command.handle(args);
  }

  showHelp(): void {
    console.log('Available commands:');
    for (const command of this.commands.values()) {
      console.log(`  ${command.signature} - ${command.description}`);
    }
  }
}
