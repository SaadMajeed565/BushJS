export declare class HttpException extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare class UnauthorizedException extends HttpException {
    constructor(message?: string);
}
export declare class ForbiddenException extends HttpException {
    constructor(message?: string);
}
export declare class NotFoundException extends HttpException {
    constructor(message?: string);
}
export declare class ValidationFailedException extends HttpException {
    errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>, message?: string);
}
//# sourceMappingURL=HttpExceptions.d.ts.map