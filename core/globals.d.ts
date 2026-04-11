import { Controller as BaseController } from './Http/Controller';
import { Model as BaseModel } from './Database/Model';
import { Middleware as BaseMiddleware } from './Http/Middleware/Middleware';
import { auth as AuthInstance } from './Auth/Auth';
declare global {
    var Controller: typeof BaseController;
    var Model: typeof BaseModel;
    var Middleware: typeof BaseMiddleware;
    var auth: typeof AuthInstance;
}
export {};
//# sourceMappingURL=globals.d.ts.map