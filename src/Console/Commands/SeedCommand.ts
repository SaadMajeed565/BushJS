import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';
import { collectRunnableFiles, loadCommandClass, resolveCommandDir } from './support';

export class SeedCommand extends Command {
  signature = 'seed';
  description = 'Run database seeders (CommonJS-first; supports --path override).';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const seedersPath = resolveCommandDir(this.app.basePath, config.structure.seeders, args);
    try {
      const seederFiles = await collectRunnableFiles([seedersPath]);
      if (seederFiles.length === 0) {
        console.log(`No seeders found in ${seedersPath}.`);
        return;
      }

      console.log('Running seeders...');
      for (const filePath of seederFiles) {
        const file = path.basename(filePath);
        const SeederClass = loadCommandClass(filePath);
        if (!SeederClass) {
          console.warn(`Skipping seeder ${file}: no default export found.`);
          continue;
        }

        const seeder = new SeederClass();
        if (typeof seeder.run !== 'function') {
          console.warn(`Skipping seeder ${file}: missing run() method.`);
          continue;
        }

        await seeder.run();
        console.log(`Seeded: ${file}`);
      }
      console.log('Seeders completed successfully.');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`${seedersPath} does not exist.`);
        return;
      }
      throw error;
    }
  }
}
