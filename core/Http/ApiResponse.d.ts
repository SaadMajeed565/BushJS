import { Response } from '../Http/Response';
export declare class ApiResponse {
    private response;
    constructor(response: Response);
    success(data: any, message?: string, status?: number): void;
    error(message?: string, status?: number, errors?: any): void;
    created(data: any, message?: string): void;
    noContent(message?: string): void;
    paginate(data: any[], total: number, page: number, perPage: number, message?: string): void;
}
export declare class Resource {
    protected resource: any;
    constructor(resource: any);
    toArray(): Record<string, any>;
}
export declare class ResourceCollection {
    protected resources: any[];
    constructor(resources: any[]);
    toArray(): Record<string, any>[];
}
//# sourceMappingURL=ApiResponse.d.ts.map