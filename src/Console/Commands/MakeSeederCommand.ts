import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, '_').toLowerCase();
}

export class MakeSeederCommand extends Command {
  signature = 'make:seeder';
  description = 'Create a new database seeder file.';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a seeder name.');
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const normalized = normalizeName(name);
    const fileName = `${timestamp}_${normalized}_seeder.ts`;
    const seedersPath = path.resolve(this.app.basePath, 'database', 'seeds');
    await fs.mkdir(seedersPath, { recursive: true });

    const className = `${toPascalCase(name)}Seeder`;
    const stubPath = path.resolve(__dirname, '../stubs/seeder.stub');
    let stub = await fs.readFile(stubPath, 'utf-8');
    stub = stub.replace(/{{class}}/g, className);

    await fs.writeFile(path.join(seedersPath, fileName), stub);
    console.log(`Seeder created at database/seeds/${fileName}`);
  }
}
