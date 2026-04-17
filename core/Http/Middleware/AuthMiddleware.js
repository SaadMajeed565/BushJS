"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestMiddleware = exports.AuthMiddleware = void 0;
const Middleware_1 = require("../Middleware/Middleware");
const Auth_1 = require("../../Auth/Auth");
class AuthMiddleware extends Middleware_1.Middleware {
    constructor(guard = 'web') {
        super();
        this.guard = guard;
    }
    async handle(request, response, next) {
        if (!(await Auth_1.auth.check(request, this.guard))) {
            response.status(401).json({
                message: 'Unauthenticated.',
            });
            return;
        }
        const user = await Auth_1.auth.user(request, this.guard);
        if (!user) {
            response.status(401).json({
                message: 'Unauthenticated.',
            });
            return;
        }
        await next();
    }
}
exports.AuthMiddleware = AuthMiddleware;
class GuestMiddleware extends Middleware_1.Middleware {
    async handle(request, response, next) {
        if (await Auth_1.auth.check(request)) {
            response.status(403).json({
                message: 'Already authenticated.',
            });
            return;
        }
        await next();
    }
}
exports.GuestMiddleware = GuestMiddleware;
//# sourceMappingURL=AuthMiddleware.js.map