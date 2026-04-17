# Routing

Bush.js routing is powered by `Router` and exposed through `Application`.

## Basic routes

```ts
import { Application } from 'bushjs';

const app = new Application();

app.get('/ping', async (_request, response) => {
  response.json({ pong: true });
});

app.post('/users', [UserController, 'store']);
```

## Routing Organization

The standard app organization keeps routes in separate files and composes them via `routes/index.ts`:

- `routes/api.ts`
- `routes/graphql.ts`
- `routes/websocket.ts`

`routes/api.ts` also demonstrates:

- middleware groups (`api`, `web`, `versioned`)
- API version prefixes (`/api/v1`, `/api/v2`)
- version deprecation middleware

Example shape:

```ts
app.router.middlewareGroup('api', [new AuthMiddleware('api')]);
app.router.middlewareGroup('versioned', [apiVersioning.middleware()]);

app.group({ prefix: '/api/v1', middleware: ['versioned'] }, () => {
  app.post('/login', [AuthController, 'login'], [authLimiter]);
  app.get('/profile', [AuthController, 'profile'], ['api']);
});
```

## Route parameters

Bush.js uses `:param` syntax:

```ts
app.get('/users/:id', async (request, response) => {
  response.json({ id: request.params.id });
});
```

## Route groups

```ts
app.group({ prefix: '/api/v1', middleware: [apiLimiter] }, () => {
  app.get('/users', [UserController, 'index']);
  app.get('/users/:id', [UserController, 'show']);
});
```

## Middleware groups

```ts
app.router.middlewareGroup('auth.api', [new AuthMiddleware('api')]);

app.get('/me', [ProfileController, 'show'], ['auth.api']);
```

## Named Routes

```ts
app.get('/users/:id', [UserController, 'show']);
app.router.name('users.show');

const path = app.router.url('users.show', { id: '123' });
```

## Resource routes

```ts
app.router.resource('/posts', PostController, {
  middleware: [new AuthMiddleware('web')],
});

app.router.apiResource('/comments', CommentController, {
  only: ['index', 'store', 'destroy'],
  middleware: [new AuthMiddleware('api')],
});
```

### Generated `resource` actions

- `GET /posts` -> `index`
- `GET /posts/create` -> `create`
- `POST /posts` -> `store`
- `GET /posts/:id` -> `show`
- `GET /posts/:id/edit` -> `edit`
- `PUT /posts/:id` -> `update`
- `DELETE /posts/:id` -> `destroy`

## Route-level middleware styles

You can pass:

- middleware instance (`new AuthMiddleware('api')`)
- middleware class (`AuthMiddleware`)
- plain function middleware

```ts
app.get('/reports', [ReportController, 'index'], [new AuthMiddleware('api'), apiLimiter]);
```

---
**Previous:** [Configuration](configuration.md) | **Next:** [Controllers](controllers.md)
