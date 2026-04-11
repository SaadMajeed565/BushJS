"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationFailedException = exports.NotFoundException = exports.ForbiddenException = exports.UnauthorizedException = exports.HttpException = void 0;
class HttpException extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HttpException';
    }
}
exports.HttpException = HttpException;
class UnauthorizedException extends HttpException {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends HttpException {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends HttpException {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
exports.NotFoundException = NotFoundException;
class ValidationFailedException extends HttpException {
    constructor(errors, message = 'Validation Failed') {
        super(message, 422);
        this.errors = errors;
    }
}
exports.ValidationFailedException = ValidationFailedException;
//# sourceMappingURL=HttpExceptions.js.map