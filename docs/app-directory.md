# App Directory

This page teaches developers how to work inside the generated `app/` directory.

## `app/Http/Controllers/`

Controllers are the places where your app handles request logic.

Example tasks for controllers:

- return a JSON response
- call a model to read or save data
- use request classes for validation
- decide which view or response to send

Example controller:

```ts
export class WelcomeController {
  async index(request, response) {
    return response.json({ message: 'Hello from Bush.js' });
  }
}
```

### Use controllers for feature actions

- `UserController` handles user endpoints
- `BlogController` handles posts and comments
- `AuthController` handles login and logout

## `app/Http/Middleware/`

Middleware runs before controller code.

Use middleware to:

- check authentication
- block banned users
- log request details
- transform request data

Example middleware:

```ts
export class Authenticate {
  async handle(request, response, next) {
    if (!request.user) {
      return response.unauthorized();
    }
    return next();
  }
}
```

## `app/Http/Requests/`

Request classes validate input and authorize the request.

Example usage:

- validate form payloads
- reject invalid JSON early
- keep controller methods clean

Example request class:

```ts
export class StorePostRequest {
  authorize() {
    return true;
  }

  rules() {
    return {
      title: 'required|string',
      body: 'required|string',
    };
  }
}
```

## `app/Models/`

Models hold data logic.

Use models to:

- query the database
- prepare search filters
- map records to objects

Example model:

```ts
export class User {
  static collection = 'users';
}
```

## `app/Policies/`

Policies centralize permission checks.

Use policies when you want to control who can do what.

Example policy:

```ts
export class ArticlePolicy {
  update(user, article) {
    return user.id === article.authorId;
  }
}
```

## `routes/`

Define endpoints inside route files.

Example route registration:

```ts
import { Router } from '@framework';
import { WelcomeController } from '../app/Http/Controllers/WelcomeController';

export function registerRoutes(router: Router) {
  router.get('/hello', WelcomeController.index);
}
```

## `config/`

Use the `config/` folder for app settings.

Examples:

- enable debug mode
- set the app URL
- configure the database connection

## `src/`

The `src/` folder starts the app and ties everything together.

You normally do not edit framework internals here. Instead, use it to:

- load your routes
- register middleware
- boot the server

## Developer workflow

1. Add a route in `routes/`.
2. Create or update a controller in `app/Http/Controllers/`.
3. Validate input with a request in `app/Http/Requests/`.
4. Access data with a model in `app/Models/`.
5. Protect actions with a policy in `app/Policies/`.

This workflow keeps your app code simple and easy to maintain.
