# Controllers

Controllers keep route files thin and centralize endpoint behavior.

## Basic controller

```ts
import { Request, Response } from 'bushjs';

export class UserController {
  async index(_request: Request, response: Response): Promise<void> {
    response.json({ users: [] });
  }

  async show(request: Request, response: Response): Promise<void> {
    response.json({ id: request.params.id });
  }
}
```

Register:

```ts
app.get('/users', [UserController, 'index']);
app.get('/users/:id', [UserController, 'show']);
```

## Extending Base Controller

Bush.js includes an abstract `Controller` with convenience methods:

- `validate(request, rules)` for rule-object validation
- `authorize(request, ability, model)` using `gate`
- `can(request, ability, model)` boolean authorization checks

```ts
import { Controller, Request, Response, rules } from 'bushjs';

export class PostController extends Controller {
  async store(request: Request, response: Response): Promise<void> {
    await this.validate(request, {
      title: [rules.required(), rules.min(3), rules.max(120)],
      body: [rules.required()],
    });

    response.status(201).json({ created: true, data: request.body });
  }
}
```

## Request and Response Patterns

Common APIs on `Request`:

- `request.input('field', fallback)`
- `request.all()`
- `request.only(['name', 'email'])`
- `request.header('authorization')`
- `request.ip()`

Common APIs on `Response`:

- `response.status(201).json(data)`
- `response.send(data)`
- `response.redirect('/login')`
- `response.header('X-App-Version', '1.0.0')`
- `response.cookie('token', value, options)`

## Recommended Controller Style

- Keep business logic small in controllers
- Move heavy domain logic to models/services
- Validate and authorize early in each action
- Return consistent response shapes across endpoints

---
**Previous:** [Routing](routing.md) | **Next:** [Middleware](middleware.md)
