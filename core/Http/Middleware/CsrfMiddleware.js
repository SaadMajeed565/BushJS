"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Middleware_1 = require("./Middleware");
class CsrfMiddleware extends Middleware_1.Middleware {
    constructor() {
        super(...arguments);
        this.TOKEN_LENGTH = 32;
        this.TOKEN_HEADER = 'x-csrf-token';
        this.TOKEN_COOKIE = 'csrf-token';
        this.TOKEN_SESSION = 'csrf-token';
    }
    async handle(request, response, next) {
        if (!request.session?.[this.TOKEN_SESSION]) {
            if (request.session) {
                request.session[this.TOKEN_SESSION] = this.generateToken();
            }
        }
        const token = request.session?.[this.TOKEN_SESSION];
        if (token) {
            response.header('X-CSRF-TOKEN', token);
            response.cookie(this.TOKEN_COOKIE, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });
        }
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (safeMethods.includes(request.method)) {
            await next();
            return;
        }
        if (!this.validateToken(request)) {
            response.status(419).json({
                message: 'CSRF token mismatch.',
                errors: {
                    csrf: ['CSRF token validation failed']
                }
            });
            return;
        }
        await next();
    }
    generateToken() {
        return crypto_1.default.randomBytes(this.TOKEN_LENGTH).toString('hex');
    }
    validateToken(request) {
        const token = this.getTokenFromRequest(request);
        const sessionToken = request.session?.[this.TOKEN_SESSION];
        if (!token || !sessionToken) {
            return false;
        }
        return this.timingSafeEqual(token, sessionToken);
    }
    getTokenFromRequest(request) {
        const headerToken = request.header(this.TOKEN_HEADER);
        if (headerToken && typeof headerToken === 'string') {
            return headerToken;
        }
        if (typeof request.body === 'object' && request.body !== null) {
            const body = request.body;
            const bodyToken = body['_token'] || body['csrf_token'];
            if (typeof bodyToken === 'string') {
                return bodyToken;
            }
        }
        return null;
    }
    timingSafeEqual(a, b) {
        try {
            return crypto_1.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
        }
        catch {
            return false;
        }
    }
}
exports.CsrfMiddleware = CsrfMiddleware;
//# sourceMappingURL=CsrfMiddleware.js.map