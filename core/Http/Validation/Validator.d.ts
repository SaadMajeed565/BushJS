import { Request } from '../Request';
import { ValidationException } from '../../Validation/Validator';
export { ValidationException };
export declare class Validator {
    private rules;
    private messages;
    private data;
    private errors;
    constructor(data: Record<string, any>, rules: Record<string, string[]>, messages?: Record<string, string>);
    static make(data: Record<string, any>, rules: Record<string, string[]>, messages?: Record<string, string>): Validator;
    validate(): Promise<boolean>;
    fails(): boolean;
    getErrors(): Record<string, string[]>;
    private addError;
    private getDefaultMessage;
    private isValidEmail;
}
export declare class FormRequest {
    protected rules(): Record<string, string[]>;
    protected messages(): Record<string, string>;
    validateRequest(request: Request): Promise<void>;
}
//# sourceMappingURL=Validator.d.ts.map