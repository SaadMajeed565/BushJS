import path from 'path';
import type { Request } from '../Http/Request';
import { Container } from '../Container/Container';
import { Router } from '../Http/Router';
import { HttpKernel } from '../Http/Kernel';
import { ConsoleKernel } from '../Console/Kernel';
import { Connection } from '../Database/Connection';
import { setupGracefulShutdown } from './GracefulShutdown';
import { config } from '../Config/Config';
import { Storage } from '../Storage/Storage';

export interface ApplicationOptions {
  basePath?: string;
  databaseUrl?: string;
}

export interface GraphQLRoute {
  path: string;
  schema: import('graphql').GraphQLSchema;
  rootValue?: any;
  middleware?: any[];
  /** Per-request GraphQL context (merged with `{ request }`). */
  buildContext?: (request: Request) => unknown | Promise<unknown>;
}

export interface SocketRoute {
  path: string;
  handler: any;
  middleware?: any[];
}

export class Application {
  basePath: string;
  container: Container;
  router: Router;
  httpKernel: HttpKernel;
  consoleKernel: ConsoleKernel;
  database: Connection;
  private graphqlRoutes: GraphQLRoute[] = [];
  private socketRoutes: SocketRoute[] = [];

  constructor(options: ApplicationOptions = {}) {
    this.basePath = options.basePath ?? process.cwd();
    Storage.init(this.basePath, config.filesystems);
    this.container = new Container();
    this.router = new Router();
    this.database = new Connection(options.databaseUrl);
    this.httpKernel = new HttpKernel(this);
    this.consoleKernel = new ConsoleKernel(this);
    this.registerBaseBindings();
    setupGracefulShutdown();
  }

  get expressApp(): import('express').Application {
    return (this.httpKernel as any).expressApp;
  }

  registerBaseBindings(): void {
    this.container.singleton('app', () => this);
    this.container.singleton('router', () => this.router);
    this.container.singleton('http.kernel', () => this.httpKernel);
    this.container.singleton('console.kernel', () => this.consoleKernel);
    this.container.singleton('database', () => this.database);
    this.container.singleton('filesystem', () => {
      const m = Storage.getManager();
      if (!m) {
        throw new Error('Filesystem manager is not initialized.');
      }
      return m;
    });
    this.container.singleton('gate', () => require('../Auth/Gate').gate);
  }

  basePathTo(pathSegment: string): string {
    return path.join(this.basePath, pathSegment);
  }

  route(method: string, routePath: string, action: any, middleware: any[] = []): this {
    this.router.register(method, routePath, action, middleware);
    return this;
  }

  get(routePath: string, action: any, middleware: any[] = []): this {
    return this.route('GET', routePath, action, middleware);
  }

  post(routePath: string, action: any, middleware: any[] = []): this {
    return this.route('POST', routePath, action, middleware);
  }

  middleware(middleware: any): this {
    this.httpKernel.middleware.push(middleware);
    return this;
  }

  group(options: any, callback: () => void): this {
    this.router.group(options, callback);
    return this;
  }

  graphql(
    path: string,
    schema: import('graphql').GraphQLSchema,
    rootValue: any = {},
    middleware: any[] = [],
    buildContext?: (request: Request) => unknown | Promise<unknown>
  ): this {
    this.graphqlRoutes.push({ path, schema, rootValue, middleware, buildContext });
    return this;
  }

  socket(path: string, handler: any, middleware: any[] = []): this {
    this.socketRoutes.push({ path, handler, middleware });
    return this;
  }

  getGraphQLRoutes(): GraphQLRoute[] {
    return this.graphqlRoutes;
  }

  getSocketRoutes(): SocketRoute[] {
    return this.socketRoutes;
  }

  async listen(port = 3000): Promise<void> {
    await this.httpKernel.listen(port);
  }

  async runConsole(argv: string[] = []): Promise<void> {
    await this.consoleKernel.handle(argv);
  }
}
