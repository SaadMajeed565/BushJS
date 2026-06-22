"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const DEFAULT_MAX_BODY_BYTES = 10 * 1024 * 1024;
class Request {
    constructor(method, path, query, body, headers, session, user) {
        this.params = {};
        this.method = method;
        this.path = path;
        this.query = query;
        this.body = body;
        this.headers = headers;
        this.session = session;
        this.user = user;
    }
    static setMaxBodyBytes(bytes) {
        Request.maxBodyBytes = bytes;
    }
    static async fromNode(nodeReq) {
        const url = new URL(nodeReq.url ?? '/', `http://${nodeReq.headers.host ?? 'localhost'}`);
        const body = await new Promise((resolve, reject) => {
            const chunks = [];
            let totalBytes = 0;
            nodeReq.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > Request.maxBodyBytes) {
                    nodeReq.destroy(new Error('Request body too large'));
                    reject(new Error('Request body too large'));
                    return;
                }
                chunks.push(chunk);
            });
            nodeReq.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf-8'));
            });
            nodeReq.on('error', (err) => {
                reject(err);
            });
        });
        let parsedBody = body;
        if (body.length > 0) {
            try {
                parsedBody = JSON.parse(body);
            }
            catch {
                parsedBody = body;
            }
        }
        const query = {};
        url.searchParams.forEach((value, key) => {
            query[key] = value;
        });
        return new Request(nodeReq.method ?? 'GET', url.pathname, query, parsedBody, nodeReq.headers);
    }
    static async fromExpress(expressReq) {
        const expressAny = expressReq;
        const cached = expressAny[Request.cacheKey];
        if (cached)
            return cached;
        const session = expressReq.session
            ? expressReq.session
            : undefined;
        const request = new Request(expressReq.method, expressReq.path, expressReq.query, expressReq.body, expressReq.headers, session, expressAny.user);
        request.expressRequest = expressReq;
        request.clientIp = expressReq.ip;
        request.params = expressReq.params;
        if (typeof expressAny.userId === 'string') {
            request.userId = expressAny.userId;
        }
        if (typeof expressAny.token === 'string') {
            request.token = expressAny.token;
        }
        if (expressAny.file) {
            request.file = expressAny.file;
        }
        if (expressAny.files) {
            request.files = expressAny.files;
        }
        expressAny[Request.cacheKey] = request;
        return request;
    }
    input(key, fallback = null) {
        if (typeof this.body === 'object' && this.body !== null) {
            return this.body[key] ?? this.query[key] ?? fallback;
        }
        return this.query[key] ?? fallback;
    }
    all() {
        const body = typeof this.body === 'object' && this.body !== null
            ? this.body
            : {};
        return { ...body, ...this.query };
    }
    only(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.input(key);
        });
        return result;
    }
    header(key) {
        return this.headers[key.toLowerCase()];
    }
    url() {
        return `${this.method} ${this.path}`;
    }
    ip() {
        if (this.clientIp && this.clientIp.trim()) {
            return this.clientIp.trim();
        }
        const xForwardedFor = this.header('x-forwarded-for');
        if (typeof xForwardedFor === 'string') {
            return xForwardedFor.split(',')[0].trim();
        }
        return xForwardedFor?.[0];
    }
    has(key) {
        return this.input(key) !== undefined && this.input(key) !== null;
    }
}
exports.Request = Request;
Request.maxBodyBytes = DEFAULT_MAX_BODY_BYTES;
Request.cacheKey = Symbol('bushjs_request');
//# sourceMappingURL=Request.js.map