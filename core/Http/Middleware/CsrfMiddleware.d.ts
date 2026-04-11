import { Middleware } from './Middleware';
import { Request } from '../Request';
import { Response } from '../Response';
export declare class CsrfMiddleware extends Middleware {
    private readonly TOKEN_LENGTH;
    private readonly TOKEN_HEADER;
    private readonly TOKEN_COOKIE;
    private readonly TOKEN_SESSION;
    handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
    private generateToken;
    private validateToken;
    private getTokenFromRequest;
    private timingSafeEqual;
}
//# sourceMappingURL=CsrfMiddleware.d.ts.map