import type { Request } from '../Http/Request';
import { Container } from '../Container/Container';
import { Router } from '../Http/Router';
import { HttpKernel } from '../Http/Kernel';
import { ConsoleKernel } from '../Console/Kernel';
import { Connection } from '../Database/Connection';
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
export declare class Application {
    basePath: string;
    container: Container;
    router: Router;
    httpKernel: HttpKernel;
    consoleKernel: ConsoleKernel;
    database: Connection;
    private graphqlRoutes;
    private socketRoutes;
    constructor(options?: ApplicationOptions);
    get expressApp(): import('express').Application;
    registerBaseBindings(): void;
    basePathTo(pathSegment: string): string;
    route(method: string, routePath: string, action: any, middleware?: any[]): this;
    get(routePath: string, action: any, middleware?: any[]): this;
    post(routePath: string, action: any, middleware?: any[]): this;
    middleware(middleware: any): this;
    group(options: any, callback: () => void): this;
    graphql(path: string, schema: import('graphql').GraphQLSchema, rootValue?: any, middleware?: any[], buildContext?: (request: Request) => unknown | Promise<unknown>): this;
    socket(path: string, handler: any, middleware?: any[]): this;
    getGraphQLRoutes(): GraphQLRoute[];
    getSocketRoutes(): SocketRoute[];
    listen(port?: number): Promise<void>;
    runConsole(argv?: string[]): Promise<void>;
}
//# sourceMappingURL=Application.d.ts.map