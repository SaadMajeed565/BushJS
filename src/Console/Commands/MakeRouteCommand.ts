import fs from 'fs/promises';
import path from 'path';
import { Command } from '../Command';
import { Application } from '../../Foundation/Application';

export class MakeRouteCommand extends Command {
  signature = 'make:route';
  description = 'Create a new route registration file.';
  protected app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  async handle(args: string[]): Promise<void> {
    const name = args[0];
    if (!name) {
      console.log('Please provide a route file name.');
      return;
    }

    const routePath = path.resolve(this.app.basePath, 'routes', `${name}.ts`);
    await fs.mkdir(path.dirname(routePath), { recursive: true });

    const stubsPath = path.resolve(__dirname, '../stubs');
    let routeStub = await fs.readFile(path.join(stubsPath, 'route.stub'), 'utf-8');

    await fs.writeFile(routePath, routeStub);
    console.log(`Route file created at ${routePath}`);
  }
}
