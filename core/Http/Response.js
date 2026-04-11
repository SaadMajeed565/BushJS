"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
class Response {
    constructor(response) {
        this.sent = false;
        if (response && 'setHeader' in response && 'end' in response) {
            this.serverResponse = response;
        }
        else {
            this.expressResponse = response;
        }
    }
    status(code) {
        if (this.expressResponse) {
            this.expressResponse.status(code);
        }
        else if (this.serverResponse) {
            this.serverResponse.statusCode = code;
        }
        return this;
    }
    header(key, value) {
        if (this.expressResponse) {
            this.expressResponse.set(key, value);
        }
        else if (this.serverResponse) {
            this.serverResponse.setHeader(key, value);
        }
        return this;
    }
    send(body) {
        if (this.sent) {
            return;
        }
        this.sent = true;
        if (this.expressResponse) {
            this.expressResponse.send(body);
        }
        else if (this.serverResponse) {
            if (typeof body === 'object') {
                this.header('Content-Type', 'application/json');
                this.serverResponse.end(JSON.stringify(body, null, 2));
                return;
            }
            this.serverResponse.end(String(body));
        }
    }
    json(body) {
        if (this.expressResponse) {
            this.expressResponse.json(body);
        }
        else {
            this.header('Content-Type', 'application/json');
            this.send(body);
        }
    }
    redirect(url, statusCode = 302) {
        if (this.expressResponse) {
            this.expressResponse.redirect(statusCode, url);
        }
        else {
            this.status(statusCode);
            this.header('Location', url);
            this.send(`Redirecting to ${url}`);
        }
    }
    html(content) {
        if (this.expressResponse) {
            this.expressResponse.type('html').send(content);
        }
        else {
            this.header('Content-Type', 'text/html');
            this.send(content);
        }
    }
    cookie(name, value, options = {}) {
        if (this.expressResponse) {
            this.expressResponse.cookie(name, value, options);
        }
        else if (this.serverResponse) {
            const cookieStr = this.buildCookieString(name, value, options);
            this.serverResponse.setHeader('Set-Cookie', cookieStr);
        }
        return this;
    }
    buildCookieString(name, value, options = {}) {
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`;
        }
        if (options.path) {
            cookie += `; Path=${options.path}`;
        }
        if (options.domain) {
            cookie += `; Domain=${options.domain}`;
        }
        if (options.secure) {
            cookie += '; Secure';
        }
        if (options.httpOnly) {
            cookie += '; HttpOnly';
        }
        if (options.sameSite) {
            cookie += `; SameSite=${options.sameSite}`;
        }
        return cookie;
    }
}
exports.Response = Response;
//# sourceMappingURL=Response.js.map