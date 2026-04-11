import { Middleware } from '../Middleware/Middleware';
import { Request } from '../Request';
import { Response } from '../Response';
export declare class AuthMiddleware extends Middleware {
    private guard;
    constructor(guard?: string);
    handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
}
export declare class GuestMiddleware extends Middleware {
    handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
}
//# sourceMappingURL=AuthMiddleware.d.ts.map