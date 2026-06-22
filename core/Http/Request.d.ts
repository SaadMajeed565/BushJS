import { IncomingMessage } from 'http';
import express from 'express';
export declare class Request<TUser = unknown> {
    method: string;
    path: string;
    query: Record<string, string>;
    body: unknown;
    headers: Record<string, string | string[]>;
    params: Record<string, string>;
    session?: Record<string, unknown>;
    user?: TUser;
    userId?: string;
    token?: string;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
    private clientIp?;
    readonly expressRequest?: express.Request;
    private static maxBodyBytes;
    constructor(method: string, path: string, query: Record<string, string>, body: unknown, headers: Record<string, string | string[]>, session?: Record<string, unknown>, user?: TUser);
    static setMaxBodyBytes(bytes: number): void;
    static fromNode(nodeReq: IncomingMessage): Promise<Request>;
    private static cacheKey;
    static fromExpress(expressReq: express.Request): Promise<Request>;
    input(key: string, fallback?: unknown): unknown;
    all(): Record<string, unknown>;
    only(keys: string[]): Record<string, unknown>;
    header(key: string): string | string[] | undefined;
    url(): string;
    ip(): string | undefined;
    has(key: string): boolean;
}
//# sourceMappingURL=Request.d.ts.map