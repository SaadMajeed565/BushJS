import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class SeedCommand extends Command {
  signature = 'seed';
  description = 'Run database seeders.';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(): Promise<void> {
    const seedersPath = path.resolve(this.app.basePath, 'database', 'seeds');
    try {
      const files = await fs.readdir(seedersPath);
      const seederFiles = files.filter((name) => name.endsWith('.ts') || name.endsWith('.js')).sort();

      if (seederFiles.length === 0) {
        console.log('No seeders found.');
        return;
      }

      console.log('Running seeders...');
      for (const file of seederFiles) {
        const filePath = path.resolve(seedersPath, file);
        const module = await import(filePath);
        const SeederClass = module.default ?? module[Object.keys(module)[0]];
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
        console.log('database/seeds directory does not exist.');
        return;
      }
      throw error;
    }
  }
}
