export interface ValidationRule {
  validate(value: any, field: string): boolean | Promise<boolean>;
  message(): string;
}

export class RequiredRule implements ValidationRule {
  validate(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  message(): string {
    return 'The :field field is required.';
  }
}

export class EmailRule implements ValidationRule {
  validate(value: any): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  message(): string {
    return 'The :field must be a valid email address.';
  }
}

export class MinRule implements ValidationRule {
  constructor(private min: number) {}

  validate(value: any): boolean {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length >= this.min;
    }
    if (typeof value === 'number') {
      return value >= this.min;
    }
    return false;
  }

  message(): string {
    return `The :field must be at least ${this.min} characters.`;
  }
}

export class MaxRule implements ValidationRule {
  constructor(private max: number) {}

  validate(value: any): boolean {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length <= this.max;
    }
    if (typeof value === 'number') {
      return value <= this.max;
    }
    return false;
  }

  message(): string {
    return `The :field may not be greater than ${this.max} characters.`;
  }
}

export class ValidationException extends Error {
  constructor(public errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

type ValidationRuleAliases = 
  | 'required' 
  | 'email' 
  | 'min' 
  | 'max' 
  | 'numeric' 
  | 'string'
  | 'confirmed'
  | 'regex'
  | 'url'
  | 'date'
  | 'after'
  | 'before'
  | 'array'
  | 'in'
  | 'not_in';

type ValidationRuleString = ValidationRuleAliases | `${ValidationRuleAliases}:${string}`;

export type ValidationRules = {
  [field: string]: ValidationRuleString | ValidationRuleString[];
};

export type ValidationMessages = {
  [field: string]: string | { [rule: string]: string };
};

export class ValidatorV2 {
  private data: Record<string, any>;
  private rules: Map<string, ValidationRuleString[]>;
  private messages: ValidationMessages;
  private validationErrors: Record<string, string[]> = {};
  private fieldNames: Map<string, string> = new Map();

  constructor(data: Record<string, any>, rules: ValidationRules, messages: ValidationMessages = {}) {
    this.data = data;
    this.messages = messages;
    this.rules = this.parseRules(rules);
  }

  static make(data: Record<string, any>, rules: ValidationRules, messages: ValidationMessages = {}): ValidatorV2 {
    return new ValidatorV2(data, rules, messages);
  }

  setNames(names: Record<string, string>): this {
    this.fieldNames = new Map(Object.entries(names));
    return this;
  }

  validate(): boolean {
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

  fails(): boolean {
    return !this.validate();
  }

  passes(): boolean {
    return this.validate();
  }

  errors(): Record<string, string[]> {
    return this.validationErrors;
  }

  getErrors(): Record<string, string[]> {
    return this.validationErrors;
  }

  private parseRules(rules: ValidationRules): Map<string, ValidationRuleString[]> {
    const parsed = new Map<string, ValidationRuleString[]>();

    for (const [field, rule] of Object.entries(rules)) {
      if (typeof rule === 'string') {
        parsed.set(field, rule.split('|') as ValidationRuleString[]);
      } else if (Array.isArray(rule)) {
        parsed.set(field, rule);
      }
    }

    return parsed;
  }

  private parseRule(rule: ValidationRuleString): [string, string] {
    const parts = rule.split(':');
    return [parts[0], parts.slice(1).join(':')];
  }

  private validateField(field: string, value: any, rule: string, parameter: string): boolean {
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

  private required(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private email(value: any): boolean {
    if (!this.required(value)) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(value));
  }

  private min(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const min = Number(parameter);
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length >= min;
    }
    return Number(value) >= min;
  }

  private max(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const max = Number(parameter);
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length <= max;
    }
    return Number(value) <= max;
  }

  private numeric(value: any): boolean {
    if (!this.required(value)) return true;
    return !isNaN(Number(value));
  }

  private string(value: any): boolean {
    if (!this.required(value)) return true;
    return typeof value === 'string';
  }

  private confirmed(field: string, value: any): boolean {
    const confirmField = `${field}_confirmation`;
    return value === this.data[confirmField];
  }

  private regex(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    try {
      const regex = new RegExp(parameter);
      return regex.test(String(value));
    } catch {
      return false;
    }
  }

  private url(value: any): boolean {
    if (!this.required(value)) return true;
    try {
      new URL(String(value));
      return true;
    } catch {
      return false;
    }
  }

  private date(value: any): boolean {
    if (!this.required(value)) return true;
    const date = new Date(String(value));
    return date instanceof Date && !isNaN(date.getTime());
  }

  private after(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const date = new Date(String(value));
    const paramDate = new Date(parameter);
    return date > paramDate;
  }

  private before(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const date = new Date(String(value));
    const paramDate = new Date(parameter);
    return date < paramDate;
  }

  private array(value: any): boolean {
    if (!this.required(value)) return true;
    return Array.isArray(value);
  }

  private in(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const items = parameter.split(',').map(v => v.trim());
    return items.includes(String(value));
  }

  private notIn(value: any, parameter: string): boolean {
    if (!this.required(value)) return true;
    const items = parameter.split(',').map(v => v.trim());
    return !items.includes(String(value));
  }

  private getErrorMessage(field: string, rule: string, parameter: string): string {
    const fieldName = this.fieldNames.get(field) || field;

    // Check custom messages
    if (this.messages[field]) {
      if (typeof this.messages[field] === 'string') {
        return (this.messages[field] as string).replace(':attribute', fieldName);
      }
      const ruleMessages = this.messages[field] as Record<string, string>;
      if (ruleMessages[rule]) {
        return ruleMessages[rule].replace(':attribute', fieldName);
      }
    }

    // Default messages
    const messages: Record<string, (field: string, param: string) => string> = {
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

export class Validator {
  private rules: Record<string, ValidationRule[]> = {};
  private data: Record<string, any> = {};
  private errors: Record<string, string[]> = {};

  constructor(data: Record<string, any>) {
    this.data = data;
  }

  rule(field: string, ...rules: ValidationRule[]): this {
    this.rules[field] = rules;
    return this;
  }

  async validate(): Promise<boolean> {
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

  getErrors(): Record<string, string[]> {
    return this.errors;
  }

  fails(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  // Static helpers
  static make(data: Record<string, any>): Validator {
    return new Validator(data);
  }
}

// Common validation rules
export const rules = {
  required: () => new RequiredRule(),
  email: () => new EmailRule(),
  min: (min: number) => new MinRule(min),
  max: (max: number) => new MaxRule(max),
};
