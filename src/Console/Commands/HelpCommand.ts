import { Command } from '../Command';

export class HelpCommand extends Command {
  signature = 'help';
  description = 'List available commands.';

  constructor(private readonly showHelp: () => void) {
    super();
  }

  async handle(): Promise<void> {
    this.showHelp();
  }
}
