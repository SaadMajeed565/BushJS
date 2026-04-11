export class HttpException extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpException';
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ValidationFailedException extends HttpException {
  public errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation Failed') {
    super(message, 422);
    this.errors = errors;
  }
}