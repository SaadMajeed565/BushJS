import crypto from 'crypto';
import { Middleware } from './Middleware';
import { Request } from '../Request';
import { Response } from '../Response';

export class CsrfMiddleware extends Middleware {
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_HEADER = 'x-csrf-token';
  private readonly TOKEN_COOKIE = 'csrf-token';
  private readonly TOKEN_SESSION = 'csrf-token';

  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
    if (!request.session?.[this.TOKEN_SESSION]) {
      if (request.session) {
        request.session[this.TOKEN_SESSION] = this.generateToken();
      }
    }

    const token = request.session?.[this.TOKEN_SESSION] as string | undefined;
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

  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  private validateToken(request: Request): boolean {
    const token = this.getTokenFromRequest(request);
    const sessionToken = request.session?.[this.TOKEN_SESSION] as string | undefined;

    if (!token || !sessionToken) {
      return false;
    }

    return this.timingSafeEqual(token, sessionToken);
  }

  private getTokenFromRequest(request: Request): string | null {
    const headerToken = request.header(this.TOKEN_HEADER);
    if (headerToken && typeof headerToken === 'string') {
      return headerToken;
    }

    if (typeof request.body === 'object' && request.body !== null) {
      const body = request.body as Record<string, unknown>;
      const bodyToken = body['_token'] || body['csrf_token'];
      if (typeof bodyToken === 'string') {
        return bodyToken;
      }
    }

    return null;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}
