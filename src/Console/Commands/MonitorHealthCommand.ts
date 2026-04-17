import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { monitoring } from '../../Foundation/MonitoringService';

export class MonitorHealthCommand extends Command {
  signature = 'monitor:health';
  description = 'Show current health status as JSON.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(): Promise<void> {
    const health = monitoring.getHealthStatus();
    console.log(JSON.stringify(health, null, 2));
  }
}
