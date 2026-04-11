import { Middleware } from './Middleware';
import { Request } from '../Request';
import { Response } from '../Response';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // in milliseconds
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface AttemptRecord {
  count: number;
  resetTime: number;
}

export class RateLimitMiddleware extends Middleware {
  private attempts: Map<string, AttemptRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    super();
    this.config = {
      maxAttempts: config.maxAttempts || 60,
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes default
      message: config.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false
    };

    // Cleanup expired entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
    const key = this.getKey(request);
    const now = Date.now();
    const record = this.attempts.get(key);

    // Create new record or reset if window expired
    if (!record || record.resetTime < now) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
    } else {
      record.count++;
    }

    const current = this.attempts.get(key)!;
    const remaining = Math.max(0, this.config.maxAttempts - current.count);
    const resetTime = current.resetTime;

    // Add rate limit headers
    response.header('X-RateLimit-Limit', this.config.maxAttempts.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    response.header('Retry-After', Math.ceil((resetTime - now) / 1000).toString());

    // Check if rate limit exceeded
    if (current.count > this.config.maxAttempts) {
      response.status(429).json({
        message: this.config.message,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      });
      return;
    }

    await next();
  }

  private getKey(request: Request): string {
    // Use IP address as the key
    let ip = request.ip() || 'unknown';
    
    const xForwardedFor = request.header('x-forwarded-for');
    if (xForwardedFor) {
      ip = typeof xForwardedFor === 'string' ? xForwardedFor : xForwardedFor[0];
    }

    const cfConnectingIp = request.header('cf-connecting-ip');
    if (cfConnectingIp) {
      ip = typeof cfConnectingIp === 'string' ? cfConnectingIp : cfConnectingIp[0];
    }

    return ip.split(',')[0].trim();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (record.resetTime < now) {
        this.attempts.delete(key);
      }
    }
  }

  // Reset for a specific IP (useful for testing)
  reset(ip: string): void {
    this.attempts.delete(ip);
  }
}

// Pre-configured limiters for common use cases
export const authLimiter = new RateLimitMiddleware({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

export const apiLimiter = new RateLimitMiddleware({
  maxAttempts: 100,
  windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
  message: 'Rate limit exceeded, please slow down.'
});
