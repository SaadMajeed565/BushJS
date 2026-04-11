"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormRequest = exports.Validator = exports.ValidationException = void 0;
const Validator_1 = require("../../Validation/Validator");
Object.defineProperty(exports, "ValidationException", { enumerable: true, get: function () { return Validator_1.ValidationException; } });
class Validator {
    constructor(data, rules, messages = {}) {
        this.messages = {};
        this.errors = {};
        this.data = data;
        this.rules = rules;
        this.messages = messages;
    }
    static make(data, rules, messages = {}) {
        return new Validator(data, rules, messages);
    }
    async validate() {
        this.errors = {};
        for (const [field, fieldRules] of Object.entries(this.rules)) {
            for (const rule of fieldRules) {
                const value = this.data[field];
                if (rule === 'required' && (value === undefined || value === null || value === '')) {
                    this.addError(field, rule);
                }
                else if (rule === 'email' && value && !this.isValidEmail(value)) {
                    this.addError(field, rule);
                }
                else if (rule === 'min' && value && typeof value === 'string' && value.length < 8) {
                    this.addError(field, rule);
                }
                else if (rule === 'confirmed' && value !== this.data[`${field}_confirmation`]) {
                    this.addError(field, rule);
                }
                // Add more rules as needed
            }
        }
        return Object.keys(this.errors).length === 0;
    }
    fails() {
        return Object.keys(this.errors).length > 0;
    }
    getErrors() {
        return this.errors;
    }
    addError(field, rule) {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        const message = this.messages[`${field}.${rule}`] || this.getDefaultMessage(field, rule);
        this.errors[field].push(message);
    }
    getDefaultMessage(field, rule) {
        const messages = {
            'required': `${field} is required`,
            'email': `${field} must be a valid email`,
            'min': `${field} must be at least 8 characters`,
            'confirmed': `${field} confirmation does not match`,
        };
        return messages[rule] || `${field} is invalid`;
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.Validator = Validator;
class FormRequest {
    rules() {
        return {};
    }
    messages() {
        return {};
    }
    async validateRequest(request) {
        const validator = Validator.make(request.all(), this.rules(), this.messages());
        const passes = await validator.validate();
        if (!passes) {
            throw new Validator_1.ValidationException(validator.getErrors());
        }
    }
}
exports.FormRequest = FormRequest;
//# sourceMappingURL=Validator.js.map