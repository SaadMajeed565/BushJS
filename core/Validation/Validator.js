"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = exports.Validator = exports.ValidatorV2 = exports.ValidationException = exports.MaxRule = exports.MinRule = exports.EmailRule = exports.RequiredRule = void 0;
class RequiredRule {
    validate(value) {
        return value !== null && value !== undefined && value !== '';
    }
    message() {
        return 'The :field field is required.';
    }
}
exports.RequiredRule = RequiredRule;
class EmailRule {
    validate(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value);
    }
    message() {
        return 'The :field must be a valid email address.';
    }
}
exports.EmailRule = EmailRule;
class MinRule {
    constructor(min) {
        this.min = min;
    }
    validate(value) {
        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length >= this.min;
        }
        if (typeof value === 'number') {
            return value >= this.min;
        }
        return false;
    }
    message() {
        return `The :field must be at least ${this.min} characters.`;
    }
}
exports.MinRule = MinRule;
class MaxRule {
    constructor(max) {
        this.max = max;
    }
    validate(value) {
        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length <= this.max;
        }
        if (typeof value === 'number') {
            return value <= this.max;
        }
        return false;
    }
    message() {
        return `The :field may not be greater than ${this.max} characters.`;
    }
}
exports.MaxRule = MaxRule;
class ValidationException extends Error {
    constructor(errors) {
        super('Validation failed');
        this.errors = errors;
        this.name = 'ValidationException';
    }
}
exports.ValidationException = ValidationException;
class ValidatorV2 {
    constructor(data, rules, messages = {}) {
        this.validationErrors = {};
        this.fieldNames = new Map();
        this.data = data;
        this.messages = messages;
        this.rules = this.parseRules(rules);
    }
    static make(data, rules, messages = {}) {
        return new ValidatorV2(data, rules, messages);
    }
    setNames(names) {
        this.fieldNames = new Map(Object.entries(names));
        return this;
    }
    validate() {
        this.validationErrors = {};
        for (const [field, rules] of this.rules.entries()) {
            const value = this.data[field];
            for (const rule of rules) {
                const [ruleName, parameter] = this.parseRule(rule);
                if (!this.validateField(field, value, ruleName, parameter)) {
                    if (!this.validationErrors[field]) {
                        this.validationErrors[field] = [];
                    }
                    this.validationErrors[field].push(this.getErrorMessage(field, ruleName, parameter));
                }
            }
        }
        return Object.keys(this.validationErrors).length === 0;
    }
    fails() {
        return !this.validate();
    }
    passes() {
        return this.validate();
    }
    errors() {
        return this.validationErrors;
    }
    getErrors() {
        return this.validationErrors;
    }
    parseRules(rules) {
        const parsed = new Map();
        for (const [field, rule] of Object.entries(rules)) {
            if (typeof rule === 'string') {
                parsed.set(field, rule.split('|'));
            }
            else if (Array.isArray(rule)) {
                parsed.set(field, rule);
            }
        }
        return parsed;
    }
    parseRule(rule) {
        const parts = rule.split(':');
        return [parts[0], parts.slice(1).join(':')];
    }
    validateField(field, value, rule, parameter) {
        switch (rule) {
            case 'required':
                return this.required(value);
            case 'email':
                return this.email(value);
            case 'min':
                return this.min(value, parameter);
            case 'max':
                return this.max(value, parameter);
            case 'numeric':
                return this.numeric(value);
            case 'string':
                return this.string(value);
            case 'confirmed':
                return this.confirmed(field, value);
            case 'regex':
                return this.regex(value, parameter);
            case 'url':
                return this.url(value);
            case 'date':
                return this.date(value);
            case 'after':
                return this.after(value, parameter);
            case 'before':
                return this.before(value, parameter);
            case 'array':
                return this.array(value);
            case 'in':
                return this.in(value, parameter);
            case 'not_in':
                return this.notIn(value, parameter);
            default:
                return true;
        }
    }
    required(value) {
        if (value === null || value === undefined)
            return false;
        if (typeof value === 'string')
            return value.trim().length > 0;
        if (Array.isArray(value))
            return value.length > 0;
        return true;
    }
    email(value) {
        if (!this.required(value))
            return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(String(value));
    }
    min(value, parameter) {
        if (!this.required(value))
            return true;
        const min = Number(parameter);
        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length >= min;
        }
        return Number(value) >= min;
    }
    max(value, parameter) {
        if (!this.required(value))
            return true;
        const max = Number(parameter);
        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length <= max;
        }
        return Number(value) <= max;
    }
    numeric(value) {
        if (!this.required(value))
            return true;
        return !isNaN(Number(value));
    }
    string(value) {
        if (!this.required(value))
            return true;
        return typeof value === 'string';
    }
    confirmed(field, value) {
        const confirmField = `${field}_confirmation`;
        return value === this.data[confirmField];
    }
    regex(value, parameter) {
        if (!this.required(value))
            return true;
        try {
            const regex = new RegExp(parameter);
            return regex.test(String(value));
        }
        catch {
            return false;
        }
    }
    url(value) {
        if (!this.required(value))
            return true;
        try {
            new URL(String(value));
            return true;
        }
        catch {
            return false;
        }
    }
    date(value) {
        if (!this.required(value))
            return true;
        const date = new Date(String(value));
        return date instanceof Date && !isNaN(date.getTime());
    }
    after(value, parameter) {
        if (!this.required(value))
            return true;
        const date = new Date(String(value));
        const paramDate = new Date(parameter);
        return date > paramDate;
    }
    before(value, parameter) {
        if (!this.required(value))
            return true;
        const date = new Date(String(value));
        const paramDate = new Date(parameter);
        return date < paramDate;
    }
    array(value) {
        if (!this.required(value))
            return true;
        return Array.isArray(value);
    }
    in(value, parameter) {
        if (!this.required(value))
            return true;
        const items = parameter.split(',').map(v => v.trim());
        return items.includes(String(value));
    }
    notIn(value, parameter) {
        if (!this.required(value))
            return true;
        const items = parameter.split(',').map(v => v.trim());
        return !items.includes(String(value));
    }
    getErrorMessage(field, rule, parameter) {
        const fieldName = this.fieldNames.get(field) || field;
        // Check custom messages
        if (this.messages[field]) {
            if (typeof this.messages[field] === 'string') {
                return this.messages[field].replace(':attribute', fieldName);
            }
            const ruleMessages = this.messages[field];
            if (ruleMessages[rule]) {
                return ruleMessages[rule].replace(':attribute', fieldName);
            }
        }
        // Default messages
        const messages = {
            required: (f) => `The ${f} field is required.`,
            email: (f) => `The ${f} must be a valid email address.`,
            min: (f, p) => `The ${f} must be at least ${p} characters.`,
            max: (f, p) => `The ${f} must not exceed ${p} characters.`,
            numeric: (f) => `The ${f} must be numeric.`,
            string: (f) => `The ${f} must be a string.`,
            confirmed: (f) => `The ${f} confirmation does not match.`,
            regex: (f) => `The ${f} format is invalid.`,
            url: (f) => `The ${f} must be a valid URL.`,
            date: (f) => `The ${f} must be a valid date.`,
            after: (f, p) => `The ${f} must be after ${p}.`,
            before: (f, p) => `The ${f} must be before ${p}.`,
            array: (f) => `The ${f} must be an array.`,
            in: (f) => `The selected ${f} is invalid.`,
            not_in: (f) => `The selected ${f} is invalid.`
        };
        return messages[rule]?.(fieldName, parameter) || `Invalid ${fieldName}.`;
    }
}
exports.ValidatorV2 = ValidatorV2;
class Validator {
    constructor(data) {
        this.rules = {};
        this.data = {};
        this.errors = {};
        this.data = data;
    }
    rule(field, ...rules) {
        this.rules[field] = rules;
        return this;
    }
    async validate() {
        this.errors = {};
        for (const [field, rules] of Object.entries(this.rules)) {
            const value = this.data[field];
            for (const rule of rules) {
                const isValid = await rule.validate(value, field);
                if (!isValid) {
                    if (!this.errors[field]) {
                        this.errors[field] = [];
                    }
                    this.errors[field].push(rule.message().replace(':field', field));
                }
            }
        }
        return Object.keys(this.errors).length === 0;
    }
    getErrors() {
        return this.errors;
    }
    fails() {
        return Object.keys(this.errors).length > 0;
    }
    // Static helpers
    static make(data) {
        return new Validator(data);
    }
}
exports.Validator = Validator;
// Common validation rules
exports.rules = {
    required: () => new RequiredRule(),
    email: () => new EmailRule(),
    min: (min) => new MinRule(min),
    max: (max) => new MaxRule(max),
};
//# sourceMappingURL=Validator.js.map