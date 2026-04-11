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
    // Generate CSRF token if not exists
    if (!request.session?.get(this.TOKEN_SESSION)) {
      request.session?.put(this.TOKEN_SESSION, this.generateToken());
    }

    // Add token to response headers
    const token = request.session?.get(this.TOKEN_SESSION);
    response.header('X-CSRF-TOKEN', token);

    // Set token in cookie for XHR requests
    response.cookie(this.TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Skip CSRF validation for safe methods and GET requests
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      await next();
      return;
    }

    // Validate CSRF token for state-changing requests
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
    const sessionToken = request.session?.get(this.TOKEN_SESSION);

    if (!token || !sessionToken) {
      return false;
    }

    // Timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(token, sessionToken);
  }

  private getTokenFromRequest(request: Request): string | null {
    // Check header first (AJAX requests)
    const headerToken = request.header(this.TOKEN_HEADER);
    if (headerToken && typeof headerToken === 'string') {
      return headerToken;
    }

    // Check form body
    const bodyToken = request.body?.['_token'] || request.body?.['csrf_token'];
    if (bodyToken) {
      return bodyToken;
    }

    // Check query parameters (not recommended but supported)
    const queryToken = request.query?.['_token'] || request.query?.['csrf_token'];
    if (queryToken) {
      return queryToken;
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
