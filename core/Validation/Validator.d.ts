export interface ValidationRule {
    validate(value: any, field: string): boolean | Promise<boolean>;
    message(): string;
}
export declare class RequiredRule implements ValidationRule {
    validate(value: any): boolean;
    message(): string;
}
export declare class EmailRule implements ValidationRule {
    validate(value: any): boolean;
    message(): string;
}
export declare class MinRule implements ValidationRule {
    private min;
    constructor(min: number);
    validate(value: any): boolean;
    message(): string;
}
export declare class MaxRule implements ValidationRule {
    private max;
    constructor(max: number);
    validate(value: any): boolean;
    message(): string;
}
export declare class ValidationException extends Error {
    errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>);
}
type ValidationRuleAliases = 'required' | 'email' | 'min' | 'max' | 'numeric' | 'string' | 'confirmed' | 'regex' | 'url' | 'date' | 'after' | 'before' | 'array' | 'in' | 'not_in';
type ValidationRuleString = ValidationRuleAliases | `${ValidationRuleAliases}:${string}`;
export type ValidationRules = {
    [field: string]: ValidationRuleString | ValidationRuleString[];
};
export type ValidationMessages = {
    [field: string]: string | {
        [rule: string]: string;
    };
};
export declare class ValidatorV2 {
    private data;
    private rules;
    private messages;
    private validationErrors;
    private fieldNames;
    constructor(data: Record<string, any>, rules: ValidationRules, messages?: ValidationMessages);
    static make(data: Record<string, any>, rules: ValidationRules, messages?: ValidationMessages): ValidatorV2;
    setNames(names: Record<string, string>): this;
    validate(): boolean;
    fails(): boolean;
    passes(): boolean;
    errors(): Record<string, string[]>;
    getErrors(): Record<string, string[]>;
    private parseRules;
    private parseRule;
    private validateField;
    private required;
    private email;
    private min;
    private max;
    private numeric;
    private string;
    private confirmed;
    private regex;
    private url;
    private date;
    private after;
    private before;
    private array;
    private in;
    private notIn;
    private getErrorMessage;
}
export declare class Validator {
    private rules;
    private data;
    private errors;
    constructor(data: Record<string, any>);
    rule(field: string, ...rules: ValidationRule[]): this;
    validate(): Promise<boolean>;
    getErrors(): Record<string, string[]>;
    fails(): boolean;
    static make(data: Record<string, any>): Validator;
}
export declare const rules: {
    required: () => RequiredRule;
    email: () => EmailRule;
    min: (min: number) => MinRule;
    max: (max: number) => MaxRule;
};
export {};
//# sourceMappingURL=Validator.d.ts.map