import {
  HttpException,
  NotFoundException,
  ValidationException,
  AuthenticationException,
  AuthorizationException,
  RateLimitException,
  InternalException,
  ServiceUnavailableException,
  UnauthorizedException,
  ForbiddenException,
} from '../../src/Exceptions/HttpExceptions';

describe('HttpExceptions', () => {
  describe('HttpException (base)', () => {
    it('sets name, statusCode, and message', () => {
      const e = new HttpException('Error', 500, { detail: 'x' });
      expect(e.name).toBe('HttpException');
      expect(e.statusCode).toBe(500);
      expect(e.message).toBe('Error');
      expect(e.details).toEqual({ detail: 'x' });
    });
  });

  describe('NotFoundException', () => {
    it('produces 404', () => {
      const e = new NotFoundException('User', 'abc');
      expect(e.statusCode).toBe(404);
      expect(e.message).toContain('User');
      expect(e.message).toContain('abc');
    });

    it('works without an id', () => {
      const e = new NotFoundException();
      expect(e.message).toBe('Resource not found');
    });
  });

  describe('ValidationException', () => {
    it('produces 422 with errors payload', () => {
      const errors = { email: ['required'] };
      const e = new ValidationException(errors);
      expect(e.statusCode).toBe(422);
      expect(e.errors).toEqual(errors);
      expect(e.message).toBe('Validation failed');
    });
  });

  describe('AuthenticationException', () => {
    it('produces 401', () => {
      const e = new AuthenticationException();
      expect(e.statusCode).toBe(401);
      expect(e.message).toBe('Unauthenticated');
    });
  });

  describe('AuthorizationException', () => {
    it('produces 403', () => {
      const e = new AuthorizationException();
      expect(e.statusCode).toBe(403);
    });
  });

  describe('RateLimitException', () => {
    it('produces 429 with retryAfter', () => {
      const e = new RateLimitException(60);
      expect(e.statusCode).toBe(429);
      expect(e.retryAfter).toBe(60);
    });
  });

  describe('InternalException', () => {
    it('produces 500', () => {
      const e = new InternalException();
      expect(e.statusCode).toBe(500);
    });
  });

  describe('ServiceUnavailableException', () => {
    it('produces 503', () => {
      const e = new ServiceUnavailableException('Down', 120);
      expect(e.statusCode).toBe(503);
      expect(e.message).toBe('Down');
    });
  });

  describe('UnauthorizedException', () => {
    it('extends AuthenticationException (401)', () => {
      const e = new UnauthorizedException();
      expect(e).toBeInstanceOf(AuthenticationException);
      expect(e.statusCode).toBe(401);
    });
  });

  describe('ForbiddenException', () => {
    it('extends AuthorizationException (403)', () => {
      const e = new ForbiddenException();
      expect(e).toBeInstanceOf(AuthorizationException);
      expect(e.statusCode).toBe(403);
    });
  });
});
