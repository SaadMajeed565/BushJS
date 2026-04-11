import { Request } from '../Request';
import { Response } from '../Response';
export declare abstract class Middleware {
    abstract handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
}
//# sourceMappingURL=Middleware.d.ts.map