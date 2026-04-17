# Middleware

Middleware runs before route actions and is the standard place for auth checks, rate limiting, and request guards.

## Built-in middleware

- `AuthMiddleware` / `GuestMiddleware`
- `CsrfMiddleware`
- `RateLimitMiddleware` (+ `authLimiter`, `apiLimiter`)

## Global middleware

```ts
import { Application, apiLimiter } from 'bushjs';

const app = new Application();
app.middleware(apiLimiter);
```

Global middleware applies to every HTTP request.

## Route middleware

```ts
import { AuthMiddleware } from 'bushjs';

app.get('/profile', [ProfileController, 'show'], [new AuthMiddleware('web')]);
app.get('/api/me', [ProfileController, 'showApi'], [new AuthMiddleware('api')]);
```

## Custom middleware class

```ts
import { Middleware, Request, Response } from 'bushjs';

export class EnsureAdmin extends Middleware {
  async handle(request: Request, response: Response, next: () => Promise<void>): Promise<void> {
    if (!request.user || request.user.role !== 'admin') {
      response.status(403).json({ message: 'Forbidden' });
      return;
    }
    await next();
  }
}
```

Attach it:

```ts
app.delete('/users/:id', [UserAdminController, 'destroy'], [new EnsureAdmin()]);
```

## Custom rate limiter

```ts
import { RateLimitMiddleware } from 'bushjs';

const loginLimiter = new RateLimitMiddleware({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts, try again later.',
});

app.post('/login', [AuthController, 'login'], [loginLimiter]);
```

## Middleware Execution Model

- Global middleware runs first
- Route/group middleware runs before action
- Middleware can short-circuit by sending a response
- Middleware can mutate request context before `next()`

---
**Previous:** [Controllers](controllers.md) | **Next:** [Validation](validation.md)
