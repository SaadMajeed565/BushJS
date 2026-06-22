export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'HttpException';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundException extends HttpException {
  constructor(resource = 'Resource', id?: string) {
    const msg = id ? `${resource} [${id}] not found` : `${resource} not found`;
    super(msg, 404, { resource, id });
    this.name = 'NotFoundException';
  }
}

export class ValidationException extends HttpException {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 422);
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

export class AuthenticationException extends HttpException {
  constructor(message = 'Unauthenticated') {
    super(message, 401);
    this.name = 'AuthenticationException';
  }
}

export class AuthorizationException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'AuthorizationException';
  }
}

export class RateLimitException extends HttpException {
  public readonly retryAfter: number;

  constructor(retryAfter: number, message = 'Too many requests') {
    super(message, 429, { retryAfter });
    this.name = 'RateLimitException';
    this.retryAfter = retryAfter;
  }
}

export class InternalException extends HttpException {
  constructor(message = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 500, details);
    this.name = 'InternalException';
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service unavailable', retryAfter?: number) {
    super(message, 503, { retryAfter });
    this.name = 'ServiceUnavailableException';
  }
}

export class UnauthorizedException extends AuthenticationException {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends AuthorizationException {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenException';
  }
}
