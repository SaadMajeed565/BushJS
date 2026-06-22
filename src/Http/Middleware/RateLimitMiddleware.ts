import rateLimit from 'express-rate-limit';
import { Middleware } from './Middleware';
import { Request } from '../Request';
import { Response } from '../Response';

interface RateLimitConfig {
  maxAttempts?: number;
  windowMs?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export class RateLimitMiddleware extends Middleware {
  private limiter: ReturnType<typeof rateLimit>;

  constructor(config: RateLimitConfig = {}) {
    super();
    this.limiter = rateLimit({
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

  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
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

  reset(ip: string): void {
    try {
      (this.limiter as any).resetKey?.(ip);
    } catch {
      // limiter may not expose resetKey in all configurations
    }
  }
}

// Pre-configured limiters for common use cases
export const authLimiter = new RateLimitMiddleware({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

export const apiLimiter = new RateLimitMiddleware({
  maxAttempts: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Rate limit exceeded, please slow down.',
});
