"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenException = exports.UnauthorizedException = exports.ServiceUnavailableException = exports.InternalException = exports.RateLimitException = exports.AuthorizationException = exports.AuthenticationException = exports.ValidationException = exports.NotFoundException = exports.HttpException = void 0;
class HttpException extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = 'HttpException';
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.HttpException = HttpException;
class NotFoundException extends HttpException {
    constructor(resource = 'Resource', id) {
        const msg = id ? `${resource} [${id}] not found` : `${resource} not found`;
        super(msg, 404, { resource, id });
        this.name = 'NotFoundException';
    }
}
exports.NotFoundException = NotFoundException;
class ValidationException extends HttpException {
    constructor(errors, message = 'Validation failed') {
        super(message, 422);
        this.name = 'ValidationException';
        this.errors = errors;
    }
}
exports.ValidationException = ValidationException;
class AuthenticationException extends HttpException {
    constructor(message = 'Unauthenticated') {
        super(message, 401);
        this.name = 'AuthenticationException';
    }
}
exports.AuthenticationException = AuthenticationException;
class AuthorizationException extends HttpException {
    constructor(message = 'Forbidden') {
        super(message, 403);
        this.name = 'AuthorizationException';
    }
}
exports.AuthorizationException = AuthorizationException;
class RateLimitException extends HttpException {
    constructor(retryAfter, message = 'Too many requests') {
        super(message, 429, { retryAfter });
        this.name = 'RateLimitException';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitException = RateLimitException;
class InternalException extends HttpException {
    constructor(message = 'Internal server error', details) {
        super(message, 500, details);
        this.name = 'InternalException';
    }
}
exports.InternalException = InternalException;
class ServiceUnavailableException extends HttpException {
    constructor(message = 'Service unavailable', retryAfter) {
        super(message, 503, { retryAfter });
        this.name = 'ServiceUnavailableException';
    }
}
exports.ServiceUnavailableException = ServiceUnavailableException;
class UnauthorizedException extends AuthenticationException {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedException';
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends AuthorizationException {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenException';
    }
}
exports.ForbiddenException = ForbiddenException;
//# sourceMappingURL=HttpExceptions.js.map