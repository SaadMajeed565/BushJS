import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { backupService } from '../../Foundation/BackupService';

export class BackupCreateCommand extends Command {
  signature = 'backup:create';
  description = 'Create a full backup.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(): Promise<void> {
    const result = await backupService.createFullBackup();
    if (result.success) {
      console.log('Backup created:', result.path);
      return;
    }
    console.error('Backup failed:', result.error ?? 'Unknown error');
  }
}
