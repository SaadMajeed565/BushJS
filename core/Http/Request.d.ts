import { IncomingMessage } from 'http';
import express from 'express';
export declare class Request {
    method: string;
    path: string;
    query: Record<string, string>;
    body: any;
    headers: Record<string, string | string[]>;
    params: Record<string, string>;
    session?: any;
    user?: any;
    userId?: string;
    token?: string;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
    constructor(method: string, path: string, query: Record<string, string>, body: any, headers: Record<string, string | string[]>, session?: any, user?: any);
    static fromNode(nodeReq: IncomingMessage): Promise<Request>;
    static fromExpress(expressReq: express.Request): Promise<Request>;
    input(key: string, fallback?: any): any;
    all(): Record<string, any>;
    only(keys: string[]): Record<string, any>;
    header(key: string): string | string[] | undefined;
    url(): string;
    ip(): string | undefined;
    has(key: string): boolean;
}
//# sourceMappingURL=Request.d.ts.map