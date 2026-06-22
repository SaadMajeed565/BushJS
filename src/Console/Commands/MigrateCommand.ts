import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';
import { collectRunnableFiles, loadCommandClass, resolveCommandDir } from './support';

export class MigrateCommand extends Command {
  signature = 'migrate';
  description = 'Run database migrations/schemas (supports --path and --rollback).';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const rollback = args.includes('--rollback');
    const defaultSchemaDir = resolveCommandDir(this.app.basePath, config.structure.schemas, args);
    const migrationDir = path.resolve(this.app.basePath, 'database', 'migrations');

    try {
      const schemaFiles = await collectRunnableFiles([defaultSchemaDir, migrationDir]);
      if (schemaFiles.length === 0) {
        console.log('No schema files found.');
        return;
      }

      if (rollback) {
        console.log('Rolling back schema files...');
        for (let i = schemaFiles.length - 1; i >= 0; i--) {
          const filePath = schemaFiles[i];
          const file = path.basename(filePath);
          const SchemaClass = await loadCommandClass(filePath);
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
      for (const filePath of schemaFiles) {
        const file = path.basename(filePath);
        const SchemaClass = await loadCommandClass(filePath);
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
    } catch (error: unknown) {
      throw error;
    }
  }
}
