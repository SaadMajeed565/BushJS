import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { backupService } from '../../Foundation/BackupService';

export class BackupListCommand extends Command {
  signature = 'backup:list';
  description = 'List available backups.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(): Promise<void> {
    console.table(backupService.listBackups());
  }
}
