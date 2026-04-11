type RouteDefinition = {
    method: string;
    path: string;
    action: any;
    middleware: any[];
    regex: RegExp;
    params: string[];
    name?: string;
};
type RouteGroup = {
    prefix?: string;
    middleware?: any[];
    name?: string;
};
export declare class Router {
    private routes;
    private groups;
    private middlewareGroups;
    private namedRoutes;
    register(method: string, path: string, action: any, middleware?: any[]): void;
    get(path: string, action: any, middleware?: any[]): void;
    post(path: string, action: any, middleware?: any[]): void;
    put(path: string, action: any, middleware?: any[]): void;
    patch(path: string, action: any, middleware?: any[]): void;
    delete(path: string, action: any, middleware?: any[]): void;
    any(path: string, action: any, middleware?: any[]): void;
    group(options: RouteGroup, callback: () => void): void;
    middlewareGroup(name: string, middleware: any[]): void;
    resource(path: string, controller: any, options?: {
        only?: string[];
        except?: string[];
        middleware?: any[];
    }): void;
    apiResource(path: string, controller: any, options?: {
        only?: string[];
        except?: string[];
        middleware?: any[];
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