import { ServerResponse } from 'http';
import express from 'express';
export declare class Response {
    private serverResponse?;
    readonly expressResponse?: express.Response;
    private sent;
    constructor(response: ServerResponse | express.Response);
    status(code: number): this;
    header(key: string, value: string): this;
    send(body?: any): void;
    json(body: any): void;
    redirect(url: string, statusCode?: number): void;
    html(content: string): void;
    cookie(name: string, value: string, options?: any): this;
    private buildCookieString;
}
//# sourceMappingURL=Response.d.ts.map