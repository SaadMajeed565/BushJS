export declare class HttpException extends Error {
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    constructor(message: string, statusCode?: number, details?: Record<string, unknown>);
}
export declare class NotFoundException extends HttpException {
    constructor(resource?: string, id?: string);
}
export declare class ValidationException extends HttpException {
    readonly errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>, message?: string);
}
export declare class AuthenticationException extends HttpException {
    constructor(message?: string);
}
export declare class AuthorizationException extends HttpException {
    constructor(message?: string);
}
export declare class RateLimitException extends HttpException {
    readonly retryAfter: number;
    constructor(retryAfter: number, message?: string);
}
export declare class InternalException extends HttpException {
    constructor(message?: string, details?: Record<string, unknown>);
}
export declare class ServiceUnavailableException extends HttpException {
    constructor(message?: string, retryAfter?: number);
}
export declare class UnauthorizedException extends AuthenticationException {
    constructor(message?: string);
}
export declare class ForbiddenException extends AuthorizationException {
    constructor(message?: string);
}
//# sourceMappingURL=HttpExceptions.d.ts.map