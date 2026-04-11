import { Application } from '../Foundation/Application';
import { Request } from './Request';
import { Response } from './Response';
import { Validator, ValidationException } from './Validation/Validator';
import { gate } from '../Auth/Gate';

export abstract class Controller {
  protected app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  json(response: Response, data: unknown): void {
    response.json(data);
  }

  send(response: Response, body: unknown): void {
    response.send(body);
  }

  redirect(response: Response, url: string, statusCode = 302): void {
    response.redirect(url, statusCode);
  }

  requestField(request: Request, key: string, fallback: any = null): any {
    return request.input(key, fallback);
  }

  async validate(request: Request, rules: Record<string, string[]>): Promise<Record<string, any>> {
    const validator = Validator.make(request.body || {}, rules);

    const passes = await validator.validate();

    if (!passes) {
      throw new ValidationException(validator.getErrors());
    }

    return request.body || {};
  }

  async authorize(request: Request, ability: string, model?: any): Promise<void> {
    await gate.authorize(request.user, ability, model);
  }

  async can(request: Request, ability: string, model?: any): Promise<boolean> {
    return await gate.allows(request.user, ability, model);
  }
}
