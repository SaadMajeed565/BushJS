# Getting Started

This guide builds a minimal feature from start to finish so you can see the framework workflow quickly.

## 1. Create and Boot a Project

```bash
npx bushjs-cli new my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

## 2. Add a Route and Controller

Create a controller in `app/Http/Controllers/UserController.ts`:

```ts
import { Request, Response } from 'bushjs';

export class UserController {
  async show(request: Request, response: Response): Promise<void> {
    response.json({
      id: request.params.id,
      message: 'User loaded successfully',
    });
  }
}
```

Register the route:

```ts
app.get('/users/:id', [UserController, 'show']);
```

## 3. Add Validation

```ts
import { ValidatorV2 } from 'bushjs';

app.post('/users', async (request, response) => {
  const validator = ValidatorV2.make(request.body, {
    name: 'required|string|min:2|max:50',
    email: 'required|email',
  });

  if (validator.fails()) {
    response.status(422).json({ errors: validator.errors() });
    return;
  }

  response.status(201).json({ user: request.body });
});
```

## 4. Protect Endpoints

```ts
import { AuthMiddleware } from 'bushjs';

app.get('/profile', [ProfileController, 'show'], [new AuthMiddleware('api')]);
```

## 5. Generate Boilerplate Faster

```bash
npm run bush make:controller UserController
npm run bush make:model User
npm run bush make:request StoreUserRequest
npm run bush make:policy UserPolicy
```
Or you can also use these commands:

```bash
node bush make:controller UserController
node bush make:model User
node bush make:request StoreUserRequest
node bush make:policy UserPolicy
```

## 6. Next Reading

- [Basics Overview](basics-overview.md)
- [Project Structure](project-structure.md)
- [Routing](routing.md)

---
**Previous:** [Installation](installation.md) | **Next:** [Basics](basics.md)
