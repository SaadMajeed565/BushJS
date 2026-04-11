import { Application } from '../Foundation/Application';
export declare class HttpKernel {
    middleware: any[];
    protected app: Application;
    private expressApp;
    constructor(app: Application);
    private setupSecurityMiddleware;
    private setupBasicMiddleware;
    private setupRateLimiting;
    private setupSession;
    listen(port?: number): Promise<void>;
    private registerRoutes;
    private registerMiddleware;
    private registerGraphQLRoutes;
    private registerSocketRoutes;
    private handleRequest;
    private executeAction;
}
//# sourceMappingURL=Kernel.d.ts.map