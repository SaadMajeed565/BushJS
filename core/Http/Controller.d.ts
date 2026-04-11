import { Application } from '../Foundation/Application';
import { Request } from './Request';
import { Response } from './Response';
export declare abstract class Controller {
    protected app: Application;
    constructor(app: Application);
    json(response: Response, data: unknown): void;
    send(response: Response, body: unknown): void;
    redirect(response: Response, url: string, statusCode?: number): void;
    requestField(request: Request, key: string, fallback?: any): any;
    validate(request: Request, rules: Record<string, string[]>): Promise<Record<string, any>>;
    authorize(request: Request, ability: string, model?: any): Promise<void>;
    can(request: Request, ability: string, model?: any): Promise<boolean>;
}
//# sourceMappingURL=Controller.d.ts.map