"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
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
    static async fromNode(nodeReq) {
        const url = new URL(nodeReq.url ?? '/', `http://${nodeReq.headers.host ?? 'localhost'}`);
        const body = await new Promise((resolve) => {
            const chunks = [];
            nodeReq.on('data', (chunk) => {
                chunks.push(chunk);
            });
            nodeReq.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf-8'));
            });
            nodeReq.on('error', () => {
                resolve('');
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
        const request = new Request(expressReq.method, expressReq.path, expressReq.query, expressReq.body, expressReq.headers, expressReq.session, expressReq.user);
        request.file = expressReq.file;
        request.files = expressReq.files;
        return request;
    }
    input(key, fallback = null) {
        return this.body[key] ?? this.query[key] ?? fallback;
    }
    all() {
        return { ...this.body, ...this.query };
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
        const xForwardedFor = this.header('x-forwarded-for');
        if (typeof xForwardedFor === 'string') {
            return xForwardedFor.split(',')[0].trim();
        }
        return xForwardedFor?.[0];
    }
    has(key) {
        return this.input(key) !== undefined;
    }
}
exports.Request = Request;
//# sourceMappingURL=Request.js.map