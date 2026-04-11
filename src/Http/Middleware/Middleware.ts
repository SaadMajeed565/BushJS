import { Request } from '../Request';
import { Response } from '../Response';

export abstract class Middleware {
  abstract handle(request: Request, response: Response, next: () => Promise<void>): Promise<void>;
}
