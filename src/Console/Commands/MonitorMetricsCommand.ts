import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { monitoring } from '../../Foundation/MonitoringService';

export class MonitorMetricsCommand extends Command {
  signature = 'monitor:metrics';
  description = 'Show performance metrics as JSON.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(): Promise<void> {
    const stats = monitoring.getPerformanceStats();
    console.log(JSON.stringify(stats, null, 2));
  }
}
