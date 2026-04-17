"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gate = exports.Gate = void 0;
const HttpExceptions_1 = require("../Exceptions/HttpExceptions");
class Gate {
    constructor() {
        this.policies = new Map();
    }
    define(model, policy) {
        this.policies.set(model, policy);
    }
    async allows(user, ability, model, ...args) {
        const policy = this.policies.get(model?.constructor?.name || model);
        if (!policy) {
            return false;
        }
        const method = policy[ability];
        if (typeof method === 'function') {
            if (ability === 'viewAny' || ability === 'create') {
                const r = await method.call(policy, user);
                return !!r;
            }
            const r = await method.call(policy, user, model);
            return !!r;
        }
        return false;
    }
    async denies(user, ability, model, ...args) {
        return !(await this.allows(user, ability, model, ...args));
    }
    async authorize(user, ability, model, ...args) {
        if (!(await this.allows(user, ability, model, ...args))) {
            throw new HttpExceptions_1.ForbiddenException('This action is unauthorized.');
        }
    }
}
exports.Gate = Gate;
exports.gate = new Gate();
//# sourceMappingURL=Gate.js.map