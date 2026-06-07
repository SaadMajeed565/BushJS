import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';
import { config } from '../../Config/Config';
import { collectRunnableFiles, loadCommandClass, resolveCommandDir } from './support';

export class SchemaCommand extends Command {
  signature = 'schema';
  description = 'Run database schema files (CommonJS-first; supports --path and --rollback).';

  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const rollback = args.includes('--rollback');
    const schemaDir = resolveCommandDir(this.app.basePath, config.structure.schemas, args);

    try {
      const schemaFiles = await collectRunnableFiles([schemaDir]);
      if (schemaFiles.length === 0) {
        console.log(`No schema files found in ${schemaDir}.`);
        return;
      }

      if (rollback) {
        console.log('Rolling back schema files...');
        for (let i = schemaFiles.length - 1; i >= 0; i--) {
          const filePath = schemaFiles[i];
          const file = path.basename(filePath);
          const SchemaClass = loadCommandClass(filePath);
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
        const SchemaClass = loadCommandClass(filePath);
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
