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
import { MigrateCommand } from './Commands/MigrateCommand';
import { MonitorHealthCommand } from './Commands/MonitorHealthCommand';
import { MonitorMetricsCommand } from './Commands/MonitorMetricsCommand';
import { BackupCreateCommand } from './Commands/BackupCreateCommand';
import { BackupListCommand } from './Commands/BackupListCommand';
import { BackupCleanupCommand } from './Commands/BackupCleanupCommand';
import { HelpCommand } from './Commands/HelpCommand';

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
    this.register(new MigrateCommand(this.app));
    this.register(new MonitorHealthCommand(this.app));
    this.register(new MonitorMetricsCommand(this.app));
    this.register(new BackupCreateCommand(this.app));
    this.register(new BackupListCommand(this.app));
    this.register(new BackupCleanupCommand(this.app));
    this.register(new HelpCommand(() => this.showHelp()));
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
    const groups: Array<{ title: string; matcher: (signature: string) => boolean }> = [
      { title: 'General', matcher: (signature) => signature === 'help' },
      { title: 'Generators', matcher: (signature) => signature.startsWith('make:') },
      { title: 'Database', matcher: (signature) => signature === 'schema' || signature === 'seed' || signature === 'migrate' },
      { title: 'Monitoring', matcher: (signature) => signature.startsWith('monitor:') },
      { title: 'Backups', matcher: (signature) => signature.startsWith('backup:') },
    ];

    const commands = Array.from(this.commands.values());
    const assigned = new Set<string>();

    console.log('Available commands:\n');
    for (const group of groups) {
      const inGroup = commands
        .filter((command) => group.matcher(command.signature))
        .sort((a, b) => a.signature.localeCompare(b.signature));

      if (inGroup.length === 0) {
        continue;
      }

      console.log(`${group.title}:`);
      for (const command of inGroup) {
        assigned.add(command.signature);
        console.log(`  ${command.signature.padEnd(20)} ${command.description}`);
      }
      console.log('');
    }

    const other = commands
      .filter((command) => !assigned.has(command.signature))
      .sort((a, b) => a.signature.localeCompare(b.signature));

    if (other.length > 0) {
      console.log('Other:');
      for (const command of other) {
        console.log(`  ${command.signature.padEnd(20)} ${command.description}`);
      }
    }
  }
}
