import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { backupService } from '../../Foundation/BackupService';

export class BackupCleanupCommand extends Command {
  signature = 'backup:cleanup';
  description = 'Remove backups older than N days (default: 30).';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const keepDays = Number.parseInt(args[0] ?? '30', 10);
    const days = Number.isFinite(keepDays) && keepDays > 0 ? keepDays : 30;
    await backupService.cleanupOldBackups(days);
    console.log(`Old backups cleaned up (kept last ${days} days).`);
  }
}
