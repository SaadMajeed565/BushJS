"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = exports.RateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const Middleware_1 = require("./Middleware");
class RateLimitMiddleware extends Middleware_1.Middleware {
    constructor(config = {}) {
        super();
        this.limiter = (0, express_rate_limit_1.default)({
            windowMs: config.windowMs ?? 15 * 60 * 1000,
            max: config.maxAttempts ?? 60,
            message: {
                message: config.message ?? 'Too many requests, please try again later.',
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: config.skipSuccessfulRequests
                ? (req) => req.method === 'GET' || req.method === 'HEAD'
                : undefined,
        });
    }
    async handle(request, response, next) {
        const expressReq = request.expressRequest;
        const expressRes = response.expressResponse;
        if (!expressReq || !expressRes) {
            await next();
            return;
        }
        this.limiter(expressReq, expressRes, () => {
            next();
        });
    }
    reset(ip) {
        try {
            this.limiter.resetKey?.(ip);
        }
        catch {
            // limiter may not expose resetKey in all configurations
        }
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
// Pre-configured limiters for common use cases
exports.authLimiter = new RateLimitMiddleware({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
});
exports.apiLimiter = new RateLimitMiddleware({
    maxAttempts: 100,
    windowMs: 15 * 60 * 1000,
    message: 'Rate limit exceeded, please slow down.',
});
//# sourceMappingURL=RateLimitMiddleware.js.map