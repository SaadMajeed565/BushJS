import { Request } from './Request';
import { Response } from './Response';
type RouteHandler = (req: Request, res: Response) => void | Promise<void>;
type RouteAction = RouteHandler | [new (...args: any[]) => any, string];
type MiddlewareItem = RouteHandler | {
    handle: RouteHandler;
} | {
    new (...args: any[]): {
        handle: RouteHandler;
    };
} | string;
type RouteDefinition = {
    method: string;
    path: string;
    action: RouteAction;
    middleware: MiddlewareItem[];
    regex: RegExp;
    params: string[];
    name?: string;
};
type RouteGroup = {
    prefix?: string;
    middleware?: MiddlewareItem[];
    name?: string;
};
export declare class Router {
    private routes;
    private groups;
    private middlewareGroups;
    private namedRoutes;
    register(method: string, path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    get(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    post(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    put(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    patch(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    delete(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    any(path: string, action: RouteAction, middleware?: MiddlewareItem[]): void;
    group(options: RouteGroup, callback: () => void): void;
    middlewareGroup(name: string, middleware: MiddlewareItem[]): void;
    resource(path: string, controller: any, options?: {
        only?: string[];
        except?: string[];
        middleware?: MiddlewareItem[];
    }): void;
    apiResource(path: string, controller: any, options?: {
        only?: string[];
        except?: string[];
        middleware?: MiddlewareItem[];
    }): void;
    name(name: string): Router;
    url(name: string, params?: Record<string, string>): string;
    private buildPath;
    private getGroupMiddleware;
    private resolveMiddleware;
    private getLastRoute;
    getRoutes(): RouteDefinition[];
    match(method: string, path: string): {
        route: RouteDefinition;
        params: Record<string, string>;
    } | null;
    private compilePath;
}
export {};
//# sourceMappingURL=Router.d.ts.map