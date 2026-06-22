import 'express-async-errors';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import expressWs from 'express-ws';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { createHandler } from 'graphql-http/lib/use/express';
import { GraphQLSchema } from 'graphql';
import { Request } from './Request';
import { Response } from './Response';
import { Application } from '../Foundation/Application';
import { Router } from './Router';
import { exceptionHandler, logger } from '../Foundation/ExceptionHandler';
import { NotFoundException } from '../Exceptions/HttpExceptions';
import { auth } from '../Auth/Auth';
import { config } from '../Config/Config';
import { Storage } from '../Storage/Storage';

function syncAuthStateToExpress(expressReq: express.Request, bush: Request): void {
  const target = expressReq as unknown as Record<string, unknown>;
  const bushAny = bush as unknown as Record<string, unknown>;
  target.user = bushAny.user;
  target.userId = bush.userId;
  if (bush.token !== undefined) {
    target.token = bush.token;
  }
}

function isMiddlewareInstance(mw: unknown): mw is { handle: (req: Request, res: Response, next: () => Promise<void>) => Promise<void> } {
  return typeof mw === 'object' && mw !== null && 'handle' in mw && typeof (mw as any).handle === 'function';
}

function isMiddlewareClass(mw: unknown): mw is { new (...args: any[]): { handle: (req: Request, res: Response, next: () => Promise<void>) => Promise<void> } } {
  return typeof mw === 'function' && 'prototype' in (mw as any) && typeof (mw as any).prototype.handle === 'function';
}

function isFunctionMiddleware(mw: unknown): mw is (req: Request, res: Response, next: () => Promise<void>) => Promise<void> {
  return typeof mw === 'function' && !('prototype' in (mw as any));
}

function wrapMiddleware(mw: unknown): express.RequestHandler {
  if (isMiddlewareInstance(mw)) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      await mw.handle(request, response, async () => {
        syncAuthStateToExpress(req, request);
        await next();
      });
    };
  }

  if (isMiddlewareClass(mw)) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      const instance = new mw();
      await instance.handle(request, response, async () => {
        syncAuthStateToExpress(req, request);
        await next();
      });
    };
  }

  if (isFunctionMiddleware(mw)) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      await mw(request, response, async () => {
        syncAuthStateToExpress(req, request);
        await next();
      });
    };
  }

  return mw as express.RequestHandler;
}

export class HttpKernel {
  public middleware: any[] = [];
  protected app: Application;
  private expressApp: express.Application;

  constructor(app: Application) {
    this.app = app;
    this.expressApp = express();
    this.expressApp.set('trust proxy', 1);
    expressWs(this.expressApp);

    this.setupSecurityMiddleware();
    this.setupBasicMiddleware();
    this.setupRateLimiting();
    this.setupSession();
    this.registerHealthRoute();
  }

  private setupSecurityMiddleware(): void {
    this.expressApp.use(helmet({
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
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = config.cors?.allowed_origins || ['http://localhost:3000'];
        const isDev = config.app.env === 'development';

        if (!origin) return callback(null, true);

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

    this.expressApp.use(cors(corsOptions));

    if (config.app.env === 'production') {
      this.expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }
  }

  private setupBasicMiddleware(): void {
    this.expressApp.use(compression({ threshold: 1024 }));
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRateLimiting(): void {
    const globalLimiter = rateLimit({
      windowMs: config.rate_limit?.global_window_ms || 15 * 60 * 1000,
      max: config.rate_limit?.global_max || 1000,
      message: {
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((config.rate_limit?.global_window_ms || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health' || req.path.startsWith('/api/')
    });

    this.expressApp.use(globalLimiter);
  }

  private setupSession(): void {
    const sessionMw = session({
      secret: config.auth.session_secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.app.env === 'production',
        httpOnly: true,
        sameSite: 'lax',
      },
    });

    this.expressApp.use((req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      sessionMw(req, res, next);
    });
  }

  async listen(port = 3000): Promise<void> {
    await Storage.ensureDirectories([
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
        logger.info(`Server running at http://localhost:${port}`);
        resolve();
      });
    });
  }

  private registerRoutes(): void {
    this.app.router.getRoutes().forEach((routeDefinition) => {
      const rawMethod = routeDefinition.method.toLowerCase();
      const method = rawMethod === 'any' ? 'all' : rawMethod;
      const path = routeDefinition.path;
      const middleware = routeDefinition.middleware || [];

      const expressMiddleware = middleware.map(mw => wrapMiddleware(mw));

      (this.expressApp as any)[method](path, ...expressMiddleware, async (req: express.Request, res: express.Response) => {
        await this.handleRequest(req, res);
      });
    });
  }

  private registerMiddleware(): void {
    this.middleware.forEach((mw) => {
      this.expressApp.use(wrapMiddleware(mw));
    });
  }

  private registerGraphQLRoutes(): void {
    this.app.getGraphQLRoutes().forEach((route) => {
      const middleware = (route.middleware || []).map((mw) => wrapMiddleware(mw));

      const handler = createHandler({
        schema: route.schema,
        rootValue: route.rootValue,
        context: async (req, _res) => {
          const bushRequest = await Request.fromExpress(req as unknown as express.Request);
          await auth.user(bushRequest, 'api');
          let context: Record<string, unknown> = { request: bushRequest };
          if (route.buildContext) {
            const extra = await route.buildContext(bushRequest);
            if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
              context = { ...context, ...(extra as Record<string, unknown>) };
            }
          }
          return context;
        },
      });

      (this.expressApp as any).all(route.path, ...middleware, handler);
    });
  }

  private registerSocketRoutes(): void {
    this.app.getSocketRoutes().forEach((route) => {
      (this.expressApp as any).ws(route.path, async (ws: any, req: express.Request) => {
        const request = await Request.fromExpress(req);
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

  private async handleRequest(req: express.Request, res: express.Response): Promise<void> {
    const request = await Request.fromExpress(req);
    const response = new Response(res);

    try {
      const matched = this.app.router.match(request.method, request.path);

      if (!matched) {
        throw new NotFoundException('Route', `${request.method} ${request.path}`);
      }

      request.params = matched.params;
      await this.executeAction(matched.route.action, request, response);
    } catch (error: unknown) {
      exceptionHandler.renderError(error, request, response);
    }
  }

  private registerErrorHandler(): void {
    this.expressApp.use(async (err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      exceptionHandler.renderError(err, request, response);
    });
  }

  private registerHealthRoute(): void {
    this.expressApp.get('/health', (_req: express.Request, res: express.Response) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });
  }

  private async executeAction(action: any, request: Request, response: Response): Promise<void> {
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
