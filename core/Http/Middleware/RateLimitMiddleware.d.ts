import { Middleware } from './Middleware';
import { Request } from '../Request';
import { Response } from '../Response';
interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}
export declare class RateLimitMiddleware extends Middleware {
    private attempts;
    private config;
    constructor(config?: Partial<RateLimitConfig>);
    handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
    private getKey;
    private cleanup;
    reset(ip: string): void;
}
export declare const authLimiter: RateLimitMiddleware;
export declare const apiLimiter: RateLimitMiddleware;
export {};
//# sourceMappingURL=RateLimitMiddleware.d.ts.map