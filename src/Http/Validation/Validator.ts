import { Request } from '../Request';
import { ValidationException } from '../../Validation/Validator';

export { ValidationException };

export class Validator {
  private rules: Record<string, string[]>;
  private messages: Record<string, string> = {};
  private data: Record<string, any>;
  private errors: Record<string, string[]> = {};

  constructor(data: Record<string, any>, rules: Record<string, string[]>, messages: Record<string, string> = {}) {
    this.data = data;
    this.rules = rules;
    this.messages = messages;
  }

  static make(data: Record<string, any>, rules: Record<string, string[]>, messages: Record<string, string> = {}): Validator {
    return new Validator(data, rules, messages);
  }

  async validate(): Promise<boolean> {
    this.errors = {};

    for (const [field, fieldRules] of Object.entries(this.rules)) {
      for (const rule of fieldRules) {
        const value = this.data[field];

        if (rule === 'required' && (value === undefined || value === null || value === '')) {
          this.addError(field, rule);
        } else if (rule === 'email' && value && !this.isValidEmail(value)) {
          this.addError(field, rule);
        } else if (rule === 'min' && value && typeof value === 'string' && value.length < 8) {
          this.addError(field, rule);
        } else if (rule === 'confirmed' && value !== this.data[`${field}_confirmation`]) {
          this.addError(field, rule);
        }
        // Add more rules as needed
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  fails(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  getErrors(): Record<string, string[]> {
    return this.errors;
  }

  private addError(field: string, rule: string): void {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }

    const message = this.messages[`${field}.${rule}`] || this.getDefaultMessage(field, rule);
    this.errors[field].push(message);
  }

  private getDefaultMessage(field: string, rule: string): string {
    const messages: Record<string, string> = {
      'required': `${field} is required`,
      'email': `${field} must be a valid email`,
      'min': `${field} must be at least 8 characters`,
      'confirmed': `${field} confirmation does not match`,
    };

    return messages[rule] || `${field} is invalid`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class FormRequest {
  protected rules(): Record<string, string[]> {
    return {};
  }

  protected messages(): Record<string, string> {
    return {};
  }

  async validateRequest(request: Request): Promise<void> {
    const validator = Validator.make(request.all(), this.rules(), this.messages());
    const passes = await validator.validate();

    if (!passes) {
      throw new ValidationException(validator.getErrors());
    }
  }
}