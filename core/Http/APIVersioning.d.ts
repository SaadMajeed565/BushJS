import express from 'express';
export interface VersionConfig {
    defaultVersion: string;
    supportedVersions: string[];
    headerName?: string;
    queryParam?: string;
    urlPrefix?: string;
}
export declare class APIVersioning {
    private config;
    constructor(config: VersionConfig);
    /**
     * Middleware to extract API version from request
     */
    middleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    /**
     * Extract version from request
     */
    private extractVersion;
    /**
     * Check if version is supported
     */
    private isValidVersion;
    /**
     * Get versioned route path
     */
    route(path: string, version?: string): string;
    /**
     * Create version-specific router
     */
    versionRouter(version: string): express.Router;
    /**
     * Get all supported versions
     */
    getSupportedVersions(): string[];
    /**
     * Get current version from request
     */
    static getVersion(req: express.Request): string;
    /**
     * Version-aware response helper
     */
    static versionedResponse(req: express.Request, data: any, versionSpecificFields?: {
        [version: string]: any;
    }): any;
}
export declare const apiVersioning: APIVersioning;
export declare function v1Route(path: string): string;
export declare function v2Route(path: string): string;
export declare function requireVersion(version: string): (req: express.Request, res: express.Response, next: express.NextFunction) => express.Response<any, Record<string, any>> | undefined;
export declare function deprecateVersion(version: string, deprecationMessage?: string): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
//# sourceMappingURL=APIVersioning.d.ts.map