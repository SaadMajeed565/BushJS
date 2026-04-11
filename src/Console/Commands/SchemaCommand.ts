import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class SchemaCommand extends Command {
  signature = 'schema';
  description = 'Run database schema files';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const rollback = args.includes('--rollback');
    const schemaDirs = [
      path.resolve(this.app.basePath, 'database', 'schemas'),
    ];
    const schemaFiles = new Set<string>();

    try {
      for (const dir of schemaDirs) {
        try {
          const files = await fs.readdir(dir);
          files
            .filter((name) => name.endsWith('.ts') || name.endsWith('.js'))
            .forEach((file) => schemaFiles.add(path.join(dir, file)));
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      if (schemaFiles.size === 0) {
        console.log('No schema files found.');
        return;
      }

      const sortedFiles = Array.from(schemaFiles).sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

      if (rollback) {
        console.log('Rolling back schema files...');
        for (let i = sortedFiles.length - 1; i >= 0; i--) {
          const filePath = sortedFiles[i];
          const file = path.basename(filePath);
          const module = await import(filePath);
          const SchemaClass = module.default ?? module[Object.keys(module)[0]];
          if (!SchemaClass) {
            console.warn(`Skipping schema file ${file}: no default export found.`);
            continue;
          }

          const schema = new SchemaClass();
          if (typeof schema.down !== 'function') {
            console.warn(`Skipping schema file ${file}: missing down() method.`);
            continue;
          }

          await schema.down();
          console.log(`Rolled back: ${file}`);
        }
        return;
      }

      console.log('Running schema files...');
      for (const filePath of sortedFiles) {
        const file = path.basename(filePath);
        const module = await import(filePath);
        const SchemaClass = module.default ?? module[Object.keys(module)[0]];
        if (!SchemaClass) {
          console.warn(`Skipping schema file ${file}: no default export found.`);
          continue;
        }

        const schema = new SchemaClass();
        if (typeof schema.up !== 'function') {
          console.warn(`Skipping schema file ${file}: missing up() method.`);
          continue;
        }

        await schema.up();
        console.log(`Applied schema file: ${file}`);
      }
      console.log('Schema files completed successfully.');
    } catch (error: any) {
      throw error;
    }
  }
}
