"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpKernel = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_ws_1 = __importDefault(require("express-ws"));
const express_session_1 = __importDefault(require("express-session"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_graphql_1 = require("express-graphql");
const Request_1 = require("./Request");
const Response_1 = require("./Response");
const ExceptionHandler_1 = require("../Exceptions/ExceptionHandler");
const HttpExceptions_1 = require("../Exceptions/HttpExceptions");
const Config_1 = require("../Config/Config");
const Storage_1 = require("../Storage/Storage");
class HttpKernel {
    constructor(app) {
        this.middleware = [];
        this.app = app;
        this.expressApp = (0, express_1.default)();
        (0, express_ws_1.default)(this.expressApp);
        this.setupSecurityMiddleware();
        this.setupBasicMiddleware();
        this.setupRateLimiting();
        this.setupSession();
    }
    setupSecurityMiddleware() {
        // Enhanced Helmet configuration with CSP and HSTS
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
        // Enhanced CORS configuration
        const corsOptions = {
            origin: (origin, callback) => {
                const allowedOrigins = Config_1.config.cors?.allowed_origins || ['http://localhost:3000'];
                const isDev = Config_1.config.app.env === 'development';
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin)
                    return callback(null, true);
                // In development, allow localhost origins
                if (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
                    return callback(null, true);
                }
                // Check against allowed origins
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
            exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
            maxAge: 86400 // 24 hours
        };
        this.expressApp.use((0, cors_1.default)(corsOptions));
        // HTTPS enforcement middleware
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
        this.expressApp.use(express_1.default.json({ limit: '10mb' }));
        this.expressApp.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    }
    setupRateLimiting() {
        // Global rate limiting
        const globalLimiter = (0, express_rate_limit_1.default)({
            windowMs: Config_1.config.rate_limit?.global_window_ms || 15 * 60 * 1000, // 15 minutes
            max: Config_1.config.rate_limit?.global_max || 1000, // 1000 requests per window
            message: {
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil((Config_1.config.rate_limit?.global_window_ms || 15 * 60 * 1000) / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Skip rate limiting for health checks
                return req.path === '/health';
            }
        });
        this.expressApp.use(globalLimiter);
    }
    setupSession() {
        this.expressApp.use((0, express_session_1.default)({
            secret: Config_1.config.auth.session_secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: Config_1.config.app.env === 'production',
                httpOnly: true,
                sameSite: 'lax',
            },
        }));
    }
    async listen(port = 3000) {
        await Storage_1.Storage.ensureDirectories([
            'uploads',
            'avatars',
            'logs',
            'logs/audit',
            'cache',
            'backups',
            'reports'
        ]);
        this.registerMiddleware();
        this.registerRoutes();
        this.registerGraphQLRoutes();
        this.registerSocketRoutes();
        return new Promise((resolve) => {
            this.expressApp.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
                resolve();
            });
        });
    }
    registerRoutes() {
        // Convert our custom routes to Express routes
        this.app.router.getRoutes().forEach((routeDefinition) => {
            const method = routeDefinition.method.toLowerCase();
            const path = routeDefinition.path;
            const middleware = routeDefinition.middleware || [];
            const expressMiddleware = middleware.map(mw => {
                if (typeof mw.handle === 'function') {
                    // Already an instance
                    return async (req, res, next) => {
                        const request = await Request_1.Request.fromExpress(req);
                        const response = new Response_1.Response(res);
                        await mw.handle(request, response, next);
                    };
                }
                else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
                    // Class constructor
                    return async (req, res, next) => {
                        const request = await Request_1.Request.fromExpress(req);
                        const response = new Response_1.Response(res);
                        const instance = new mw();
                        await instance.handle(request, response, next);
                    };
                }
                return mw; // Function middleware
            });
            this.expressApp[method](path, ...expressMiddleware, async (req, res) => {
                await this.handleRequest(req, res);
            });
        });
    }
    registerMiddleware() {
        this.middleware.forEach((mw) => {
            if (typeof mw.handle === 'function') {
                this.expressApp.use(async (req, res, next) => {
                    const request = await Request_1.Request.fromExpress(req);
                    const response = new Response_1.Response(res);
                    await mw.handle(request, response, next);
                });
            }
            else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
                this.expressApp.use(async (req, res, next) => {
                    const request = await Request_1.Request.fromExpress(req);
                    const response = new Response_1.Response(res);
                    const instance = new mw();
                    await instance.handle(request, response, next);
                });
            }
            else {
                this.expressApp.use(mw);
            }
        });
    }
    registerGraphQLRoutes() {
        this.app.getGraphQLRoutes().forEach((route) => {
            const middleware = (route.middleware || []).map((mw) => {
                if (typeof mw.handle === 'function') {
                    return async (req, res, next) => {
                        const request = await Request_1.Request.fromExpress(req);
                        const response = new Response_1.Response(res);
                        await mw.handle(request, response, next);
                    };
                }
                else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
                    return async (req, res, next) => {
                        const request = await Request_1.Request.fromExpress(req);
                        const response = new Response_1.Response(res);
                        const instance = new mw();
                        await instance.handle(request, response, next);
                    };
                }
                return mw;
            });
            this.expressApp.use(route.path, ...middleware, (0, express_graphql_1.graphqlHTTP)({
                schema: route.schema,
                rootValue: route.rootValue,
                graphiql: process.env.NODE_ENV !== 'production',
            }));
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
        try {
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            const matched = this.app.router.match(request.method, request.path);
            if (!matched) {
                throw new HttpExceptions_1.NotFoundException();
            }
            request.params = matched.params;
            await this.executeAction(matched.route.action, request, response);
        }
        catch (error) {
            const exceptionHandler = new ExceptionHandler_1.ExceptionHandler();
            const request = await Request_1.Request.fromExpress(req);
            const response = new Response_1.Response(res);
            exceptionHandler.handle(error, request, response);
        }
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