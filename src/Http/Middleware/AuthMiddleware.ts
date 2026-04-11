import { Middleware } from '../Middleware/Middleware';
import { Request } from '../Request';
import { Response } from '../Response';
import { auth } from '../../Auth/Auth';

export class AuthMiddleware extends Middleware {
  private guard: string;

  constructor(guard = 'web') {
    super();
    this.guard = guard;
  }

  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
    if (!(await auth.check(request, this.guard))) {
      response.status(401).json({
        message: 'Unauthenticated.',
      });
      return;
    }

    await next();
  }
}

export class GuestMiddleware extends Middleware {
  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
    if (await auth.check(request)) {
      response.status(403).json({
        message: 'Already authenticated.',
      });
      return;
    }

    await next();
  }
}
