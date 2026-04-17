import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import expressWs from 'express-ws';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLSchema } from 'graphql';
import { Request } from './Request';
import { Response } from './Response';
import { Application } from '../Foundation/Application';
import { Router } from './Router';
import { ExceptionHandler } from '../Exceptions/ExceptionHandler';
import { NotFoundException } from '../Exceptions/HttpExceptions';
import { auth } from '../Auth/Auth';
import { config } from '../Config/Config';
import { Storage } from '../Storage/Storage';

/** Copy auth fields from the Bush request onto Express so a later `Request.fromExpress` sees them. */
function syncAuthStateToExpress(expressReq: express.Request, bush: Request): void {
  (expressReq as any).user = bush.user;
  (expressReq as any).userId = bush.userId;
  if (bush.token !== undefined) {
    (expressReq as any).token = bush.token;
  }
}

export class HttpKernel {
  public middleware: any[] = [];
  protected app: Application;
  private expressApp: express.Application;

  constructor(app: Application) {
    this.app = app;
    this.expressApp = express();
    expressWs(this.expressApp);

    this.setupSecurityMiddleware();
    this.setupBasicMiddleware();
    this.setupRateLimiting();
    this.setupSession();
  }

  private setupSecurityMiddleware(): void {
    // Enhanced Helmet configuration with CSP and HSTS
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

    // Enhanced CORS configuration
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = config.cors?.allowed_origins || ['http://localhost:3000'];
        const isDev = config.app.env === 'development';

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

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

    this.expressApp.use(cors(corsOptions));

    // HTTPS enforcement middleware
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
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRateLimiting(): void {
    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: config.rate_limit?.global_window_ms || 15 * 60 * 1000, // 15 minutes
      max: config.rate_limit?.global_max || 1000, // 1000 requests per window
      message: {
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((config.rate_limit?.global_window_ms || 15 * 60 * 1000) / 1000)
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

  private setupSession(): void {
    this.expressApp.use(
      session({
        secret: config.auth.session_secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: config.app.env === 'production',
          httpOnly: true,
          sameSite: 'lax',
        },
      })
    );
  }

  async listen(port = 3000): Promise<void> {
    await Storage.ensureDirectories([
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

  private registerRoutes(): void {
    // Convert our custom routes to Express routes
    this.app.router.getRoutes().forEach((routeDefinition) => {
      const method = routeDefinition.method.toLowerCase() as keyof express.Application;
      const path = routeDefinition.path;
      const middleware = routeDefinition.middleware || [];

      const expressMiddleware = middleware.map(mw => {
        if (typeof mw.handle === 'function') {
          // Already an instance
          return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const request = await Request.fromExpress(req);
            const response = new Response(res);
            await mw.handle(request, response, async () => {
              syncAuthStateToExpress(req, request);
              await next();
            });
          };
        } else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
          // Class constructor
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
        return mw; // Function middleware
      });

      (this.expressApp as any)[method](path, ...expressMiddleware, async (req: express.Request, res: express.Response) => {
        await this.handleRequest(req, res);
      });
    });
  }

  private registerMiddleware(): void {
    this.middleware.forEach((mw) => {
      if (typeof mw.handle === 'function') {
        this.expressApp.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const request = await Request.fromExpress(req);
          const response = new Response(res);
          await mw.handle(request, response, async () => {
            syncAuthStateToExpress(req, request);
            await next();
          });
        });
      } else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
        this.expressApp.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const request = await Request.fromExpress(req);
          const response = new Response(res);
          const instance = new mw();
          await instance.handle(request, response, async () => {
            syncAuthStateToExpress(req, request);
            await next();
          });
        });
      } else {
        this.expressApp.use(mw);
      }
    });
  }

  private registerGraphQLRoutes(): void {
    this.app.getGraphQLRoutes().forEach((route) => {
      const middleware = (route.middleware || []).map((mw) => {
        if (typeof mw.handle === 'function') {
          return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const request = await Request.fromExpress(req);
            const response = new Response(res);
            await mw.handle(request, response, async () => {
              syncAuthStateToExpress(req, request);
              await next();
            });
          };
        } else if (mw && typeof mw === 'function' && mw.prototype && typeof mw.prototype.handle === 'function') {
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
        return mw;
      });

      this.expressApp.use(
        route.path,
        ...middleware,
        graphqlHTTP(async (req, res) => {
          const bushRequest = await Request.fromExpress(req as express.Request);
          await auth.user(bushRequest, 'api');
          let context: Record<string, unknown> = { request: bushRequest };
          if (route.buildContext) {
            const extra = await route.buildContext(bushRequest);
            if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
              context = { ...context, ...(extra as Record<string, unknown>) };
            }
          }
          return {
            schema: route.schema,
            rootValue: route.rootValue,
            context,
            graphiql: process.env.NODE_ENV !== 'production',
          };
        })
      );
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
    try {
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      const matched = this.app.router.match(request.method, request.path);

      if (!matched) {
        throw new NotFoundException();
      }

      request.params = matched.params;
      await this.executeAction(matched.route.action, request, response);
    } catch (error: any) {
      const exceptionHandler = new ExceptionHandler();
      const request = await Request.fromExpress(req);
      const response = new Response(res);
      exceptionHandler.handle(error, request, response);
    }
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