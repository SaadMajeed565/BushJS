"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gate = exports.Gate = void 0;
class Gate {
    constructor() {
        this.policies = new Map();
    }
    define(model, policy) {
        this.policies.set(model, policy);
    }
    allows(user, ability, model, ...args) {
        const policy = this.policies.get(model?.constructor?.name || model);
        if (!policy) {
            return Promise.resolve(false);
        }
        const method = policy[ability];
        if (typeof method === 'function') {
            if (ability === 'viewAny' || ability === 'create') {
                return Promise.resolve(method.call(policy, user));
            }
            else {
                return Promise.resolve(method.call(policy, user, model));
            }
        }
        return Promise.resolve(false);
    }
    denies(user, ability, model, ...args) {
        return this.allows(user, ability, model, ...args).then(allowed => !allowed);
    }
    authorize(user, ability, model, ...args) {
        if (!this.allows(user, ability, model, ...args)) {
            throw new Error('Unauthorized');
        }
    }
}
exports.Gate = Gate;
exports.gate = new Gate();
//# sourceMappingURL=Gate.js.map