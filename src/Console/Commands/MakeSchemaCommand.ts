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

export class MakeSchemaCommand extends Command {
  signature = 'make:schema';
  description = 'Create a new database schema file.';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a schema name.');
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const normalized = normalizeName(name);
    const fileName = `${timestamp}_${normalized}.ts`;
    const schemasPath = path.resolve(this.app.basePath, 'database', 'schemas');
    await fs.mkdir(schemasPath, { recursive: true });

    const className = `${toPascalCase(name)}Schema`;
    const tableName = normalized.endsWith('s') ? normalized : `${normalized}s`;
    const stubPath = path.resolve(__dirname, '../stubs/schema.stub');
    let stub = await fs.readFile(stubPath, 'utf-8');
    stub = stub.replace(/{{class}}/g, className).replace(/{{table}}/g, tableName);

    await fs.writeFile(path.join(schemasPath, fileName), stub);
    console.log(`Schema created at database/schemas/${fileName}`);
  }
}
