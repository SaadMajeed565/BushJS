"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpKernel = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_ws_1 = __importDefault(require("express-ws"));
const express_session_1 = __importDefault(require("express-session"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_2 = require("graphql-http/lib/use/express");
const Request_1 = require("./Request");
const Response_1 = require("./Response");
const ExceptionHandler_1 = require("../Foundation/ExceptionHandler");
const HttpExceptions_1 = require("../Exceptions/HttpExceptions");
const Auth_1 = require("../Auth/Auth");
const Config_1 = require("../Config/Config");
const Storage_1 = require("../Storage/Storage");
function syncAuthStateToExpress(expressReq, bush) {
    const target = expressReq;
    const bushAny = bush;
    target.user = bushAny.user;
    target.userId = bush.userId;
    if (bush.token !== undefined) {
        target.token = bush.token;
    }
}
function isMiddlewareInstance(mw) {
    return typeof mw === 'object' && mw !== null && 'handle' in mw && typeof mw.handle === 'function';
}
function isMiddlewareClass(mw) {
    return typeof mw === 'function' && 'prototype' in mw && typeof mw.prototype.handle === 'function';
}
function isFunctionMiddleware(mw) {
    return typeof mw === 'function' && !('prototype' in mw);
}
function wrapMiddleware(mw) {
    if (isMiddlewareInstance(mw)) {
        return async (req, res, next) => {
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            await mw.handle(request, response, async () => {
                syncAuthStateToExpress(req, request);
                await next();
            });
        };
    }
    if (isMiddlewareClass(mw)) {
        return async (req, res, next) => {
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            const instance = new mw();
            await instance.handle(request, response, async () => {
                syncAuthStateToExpress(req, request);
                await next();
            });
        };
    }
    if (isFunctionMiddleware(mw)) {
        return async (req, res, next) => {
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            await mw(request, response, async () => {
                syncAuthStateToExpress(req, request);
                await next();
            });
        };
    }
    return mw;
}
class HttpKernel {
    constructor(app) {
        this.middleware = [];
        this.app = app;
        this.expressApp = (0, express_1.default)();
        this.expressApp.set('trust proxy', 1);
        (0, express_ws_1.default)(this.expressApp);
        this.setupSecurityMiddleware();
        this.setupBasicMiddleware();
        this.setupRateLimiting();
        this.setupSession();
        this.registerHealthRoute();
    }
    setupSecurityMiddleware() {
        this.expressApp.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: { policy: "strict-origin-when-cross-origin" }
        }));
        const corsOptions = {
            origin: (origin, callback) => {
                const allowedOrigins = Config_1.config.cors?.allowed_origins || ['http://localhost:3000'];
                const isDev = Config_1.config.app.env === 'development';
                if (!origin)
                    return callback(null, true);
                if (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
                    return callback(null, true);
                }
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(null, false);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
            exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
            maxAge: 86400
        };
        this.expressApp.use((0, cors_1.default)(corsOptions));
        if (Config_1.config.app.env === 'production') {
            this.expressApp.use((req, res, next) => {
                if (req.header('x-forwarded-proto') !== 'https') {
                    res.redirect(`https://${req.header('host')}${req.url}`);
                }
                else {
                    next();
                }
            });
        }
    }
    setupBasicMiddleware() {
        this.expressApp.use((0, compression_1.default)({ threshold: 1024 }));
        this.expressApp.use(express_1.default.json({ limit: '10mb' }));
        this.expressApp.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    }
    setupRateLimiting() {
        const globalLimiter = (0, express_rate_limit_1.default)({
            windowMs: Config_1.config.rate_limit?.global_window_ms || 15 * 60 * 1000,
            max: Config_1.config.rate_limit?.global_max || 1000,
            message: {
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((Config_1.config.rate_limit?.global_window_ms || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => req.path === '/health' || req.path.startsWith('/api/')
        });
        this.expressApp.use(globalLimiter);
    }
    setupSession() {
        const sessionMw = (0, express_session_1.default)({
            secret: Config_1.config.auth.session_secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: Config_1.config.app.env === 'production',
                httpOnly: true,
                sameSite: 'lax',
            },
        });
        this.expressApp.use((req, res, next) => {
            if (req.path.startsWith('/api/'))
                return next();
            sessionMw(req, res, next);
        });
    }
    async listen(port = 3000) {
        await Storage_1.Storage.ensureDirectories([
            'uploads',
            'avatars',
            'logs',
            'cache',
            'backups',
            'reports'
        ]);
        this.registerMiddleware();
        this.registerRoutes();
        this.registerGraphQLRoutes();
        this.registerSocketRoutes();
        this.registerErrorHandler();
        return new Promise((resolve) => {
            this.expressApp.listen(port, () => {
                ExceptionHandler_1.logger.info(`Server running at http://localhost:${port}`);
                resolve();
            });
        });
    }
    registerRoutes() {
        this.app.router.getRoutes().forEach((routeDefinition) => {
            const rawMethod = routeDefinition.method.toLowerCase();
            const method = rawMethod === 'any' ? 'all' : rawMethod;
            const path = routeDefinition.path;
            const middleware = routeDefinition.middleware || [];
            const expressMiddleware = middleware.map(mw => wrapMiddleware(mw));
            this.expressApp[method](path, ...expressMiddleware, async (req, res) => {
                await this.handleRequest(req, res);
            });
        });
    }
    registerMiddleware() {
        this.middleware.forEach((mw) => {
            this.expressApp.use(wrapMiddleware(mw));
        });
    }
    registerGraphQLRoutes() {
        this.app.getGraphQLRoutes().forEach((route) => {
            const middleware = (route.middleware || []).map((mw) => wrapMiddleware(mw));
            const handler = (0, express_2.createHandler)({
                schema: route.schema,
                rootValue: route.rootValue,
                context: async (req, _res) => {
                    const bushRequest = await Request_1.Request.fromExpress(req);
                    await Auth_1.auth.user(bushRequest, 'api');
                    let context = { request: bushRequest };
                    if (route.buildContext) {
                        const extra = await route.buildContext(bushRequest);
                        if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
                            context = { ...context, ...extra };
                        }
                    }
                    return context;
                },
            });
            this.expressApp.all(route.path, ...middleware, handler);
        });
    }
    registerSocketRoutes() {
        this.app.getSocketRoutes().forEach((route) => {
            this.expressApp.ws(route.path, async (ws, req) => {
                const request = await Request_1.Request.fromExpress(req);
                if (typeof route.handler === 'function' && route.handler.prototype && typeof route.handler.prototype.handle === 'function') {
                    const instance = new route.handler();
                    await instance.handle(ws, request);
                    return;
                }
                if (typeof route.handler === 'function') {
                    await route.handler(ws, request);
                    return;
                }
                throw new Error('Invalid WebSocket handler');
            });
        });
    }
    async handleRequest(req, res) {
        const request = await Request_1.Request.fromExpress(req);
        const response = new Response_1.Response(res);
        try {
            const matched = this.app.router.match(request.method, request.path);
            if (!matched) {
                throw new HttpExceptions_1.NotFoundException('Route', `${request.method} ${request.path}`);
            }
            request.params = matched.params;
            await this.executeAction(matched.route.action, request, response);
        }
        catch (error) {
            ExceptionHandler_1.exceptionHandler.renderError(error, request, response);
        }
    }
    registerErrorHandler() {
        this.expressApp.use(async (err, req, res, _next) => {
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            ExceptionHandler_1.exceptionHandler.renderError(err, request, response);
        });
    }
    registerHealthRoute() {
        this.expressApp.get('/health', (_req, res) => {
            res.json({ status: 'ok', uptime: process.uptime() });
        });
    }
    async executeAction(action, request, response) {
        if (typeof action === 'function') {
            await action(request, response);
            return;
        }
        if (Array.isArray(action) && action.length === 2) {
            const [controllerClass, methodName] = action;
            const controllerInstance = new controllerClass();
            const method = controllerInstance[methodName];
            if (typeof method === 'function') {
                await method.call(controllerInstance, request, response);
                return;
            }
        }
        throw new Error('Invalid action');
    }
}
exports.HttpKernel = HttpKernel;
//# sourceMappingURL=Kernel.js.map