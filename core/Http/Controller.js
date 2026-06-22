"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const Validator_1 = require("../Validation/Validator");
const Gate_1 = require("../Auth/Gate");
class Controller {
    constructor(app) {
        this.app = app;
    }
    json(response, data) {
        response.json(data);
    }
    send(response, body) {
        response.send(body);
    }
    redirect(response, url, statusCode = 302) {
        response.redirect(url, statusCode);
    }
    requestField(request, key, fallback = null) {
        return request.input(key, fallback);
    }
    async validate(request, rules) {
        const data = typeof request.body === 'object' && request.body !== null
            ? request.body
            : {};
        const validator = Validator_1.ValidatorV2.make(data, rules);
        const passes = await validator.validate();
        if (!passes) {
            throw new Validator_1.ValidationException(validator.getErrors());
        }
        return data;
    }
    async authorize(request, ability, model) {
        await Gate_1.gate.authorize(request.user, ability, model);
    }
    async can(request, ability, model) {
        return await Gate_1.gate.allows(request.user, ability, model);
    }
}
exports.Controller = Controller;
//# sourceMappingURL=Controller.js.map