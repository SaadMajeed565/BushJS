#!/usr/bin/env node
import 'dotenv/config';
import { Application } from '../Foundation/Application';

async function main(): Promise<void> {
  const app = new Application({ basePath: process.cwd() });
  await app.runConsole(process.argv);
}

main().catch((error) => {
  console.error(error as Error);
  process.exit(1);
});
