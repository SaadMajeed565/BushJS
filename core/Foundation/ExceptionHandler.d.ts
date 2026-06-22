import { Request } from '../Http/Request';
import { Response } from '../Http/Response';
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    stack?: string;
}
export declare class Logger {
    private readonly explicitLogDir?;
    private logLevel;
    constructor(explicitLogDir?: string | undefined);
    private effectiveLogDir;
    setLevel(level: LogLevel): void;
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warning(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>, stack?: string): void;
    critical(message: string, context?: Record<string, unknown>, stack?: string): void;
    private log;
    private shouldLog;
    private logToConsole;
    private logToFile;
}
export declare class ExceptionHandler {
    private logger;
    constructor(logger?: Logger);
    handle(error: unknown, request: Request, response: Response): void;
    renderError(error: unknown, request: Request, response: Response): void;
    private wantJson;
}
export declare const logger: Logger;
export declare const exceptionHandler: ExceptionHandler;
//# sourceMappingURL=ExceptionHandler.d.ts.map