# Bush.js

[![CI](https://github.com/SaadMajeed565/BushJS/actions/workflows/ci.yml/badge.svg)](https://github.com/SaadMajeed565/BushJS/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/bushjs)](https://www.npmjs.com/package/bushjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**bushjs** — the core runtime library of the Bush.js framework. A Node.js framework built with Express.js and MongoDB.

```bash
npm install bushjs
```

## Official Links

- Full documentation: [Bush.js Docs README](https://github.com/SaadMajeed565/BushJS/blob/main/docs/README.md)
- GitHub repository: [SaadMajeed565/BushJS](https://github.com/SaadMajeed565/BushJS/)

## Features

- **HTTP Server** — Express.js-based server with middleware pipeline
- **Routing** — Route registration (GET, POST, PUT, PATCH, DELETE, groups, named routes)
- **Controllers** — Base controller with validation and authorization helpers
- **Middleware** — Auth, guest, CSRF, rate-limiting middleware
- **Authentication** — Session and JWT token guards with user providers
- **Authorization** — Gates and policies for access control
- **Validation** — Rule-based validation (required, email, min/max, confirmed, unique, etc.)
- **Database** — Mongoose ODM integration with Model, QueryBuilder, Schema runner, and Seeder
- **Service Container** — Dependency injection container with singleton bindings
- **Config** — Centralized configuration management
- **Storage** — Filesystem abstraction (local disk adapter)
- **API Versioning** — URI prefix-based versioning with deprecation support
- **GraphQL** — GraphQL route registration via `graphql-http`
- **WebSockets** — WebSocket route registration via `express-ws` / `ws`
- **Console** — CLI command kernel with scaffolding generators (controllers, models, middleware, etc.)
- **Exception Handling** — Structured error handling with logging
- **Graceful Shutdown** — Clean server teardown on SIGTERM/SIGINT

## Quick Start

```typescript
import { Application } from 'bushjs';

const app = new Application({ basePath: process.cwd() });

app.get('/hello', async (_req, res) => {
  res.send('Hello from Bush.js');
});

await app.listen(3000);
console.log('Server running on http://localhost:3000');
```

## Project Structure

This is the **framework core package**. The actual source lives in `src/` and compiles to `core/`.

```
bush-js/
├── src/                      # TypeScript source
│   ├── Auth/                 # Authentication (SessionGuard, TokenGuard, Gate)
│   ├── Config/               # Configuration manager
│   ├── Console/              # CLI kernel + generator commands
│   │   └── Commands/         # make:controller, make:model, migrate, seed, etc.
│   ├── Container/            # Service container (DI)
│   ├── Contracts/            # Interface contracts
│   ├── Database/             # MongoDB/Mongoose integration
│   │   ├── Connection.ts     # Database connection manager
│   │   ├── Model.ts          # Base model class
│   │   ├── QueryBuilder.ts   # Fluent query builder
│   │   ├── Schema.ts         # Schema runner + builder
│   │   ├── Seeder.ts         # Database seeder
│   │   └── ObjectIdUtils.ts  # ObjectId validation/coercion
│   ├── Exceptions/           # HTTP exception classes
│   ├── Foundation/           # Application bootstrap, exception handler, graceful shutdown
│   ├── Http/                 # HTTP layer
│   │   ├── Controller.ts     # Base controller
│   │   ├── Kernel.ts         # HTTP middleware kernel
│   │   ├── Request.ts        # Request wrapper
│   │   ├── Response.ts       # Response wrapper
│   │   ├── Router.ts         # Route registration + matching
│   │   ├── ApiResponse.ts    # Standardized JSON responses
│   │   ├── APIVersioning.ts  # API versioning support
│   │   └── Middleware/       # AuthMiddleware, CsrfMiddleware, RateLimitMiddleware
│   ├── Storage/              # Filesystem abstraction (local adapter)
│   ├── Validation/           # Rule-based validator
│   ├── WebSockets/           # WebSocket support
│   ├── bush.ts               # Convenience re-exports
│   └── index.ts              # Public API exports
├── core/                     # Compiled JavaScript output (published to npm)
├── tests/                    # Test suite
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docs/                     # Documentation
├── storage/                  # File storage (backups, etc.)
├── package.json
└── tsconfig.json
```

## Core API

### Application

The central bootstrap class. Creates the HTTP server, router, console kernel, database connection, and service container.

```typescript
import { Application } from 'bushjs';

const app = new Application({ basePath: __dirname, databaseUrl: 'mongodb://localhost:27017/myapp' });
```

| Method | Description |
|--------|-------------|
| `app.get(path, handler, middleware?)` | Register a GET route |
| `app.post(path, handler, middleware?)` | Register a POST route |
| `app.route(method, path, handler, middleware?)` | Register a route by HTTP method string |
| `app.router.put/patch/delete/any(...)` | Register other HTTP methods via the Router |
| `app.group({ prefix, middleware }, callback)` | Group routes with shared prefix/middleware |
| `app.graphql(path, schema, rootValue?)` | Register a GraphQL endpoint |
| `app.socket(path, handler)` | Register a WebSocket endpoint |
| `app.basePathTo(subpath)` | Resolve a path relative to the app base |
| `await app.listen(port)` | Start the HTTP server |
| `app.expressApp` | Access the underlying Express application |

### Router

Standalone route registration and matching. Accessed via `app.router` or used independently.

```typescript
import { Router } from 'bushjs';

const router = new Router();
router.get('/users', handler);
router.post('/users', handler, [authMiddleware]);
router.group({ prefix: '/admin', middleware: [adminMiddleware] }, () => {
  router.get('/dashboard', dashboardHandler);
});
```

| Method | Description |
|--------|-------------|
| `router.get/post/put/patch/delete(path, handler, middleware?)` | Register a route by HTTP method |
| `router.any(path, handler, middleware?)` | Match any HTTP method |
| `router.register(method, path, handler, middleware?)` | Register a route by method string |
| `router.group({ prefix, middleware }, callback)` | Group routes with shared config |

### Controller

Abstract base controller with validation and authorization helpers.

```typescript
import { Controller, Request, Response } from 'bushjs';

export class UserController extends Controller {
  async index(request: Request, response: Response) {
    const data = await this.validate(request, {
      email: ['required', 'email'],
    });
    await this.authorize(request, 'view-users');
    response.json({ users: [] });
  }
}
```

### Model

Mongoose-based model with a fluent query builder.

```typescript
import { Model } from 'bushjs';

export class User extends Model {
  static collection = 'users';
  static fields = {
    name: { type: 'string' as const, required: true },
    email: { type: 'string' as const, required: true, unique: true },
  };
}

const users = await User.all();
const user = await User.find('id');
const admins = await User.where('role', 'admin').get();
```

### Authentication

JWT token-based guard (default) and session-based guard for web apps.

```typescript
import { auth, AuthMiddleware } from 'bushjs';

// API login (default 'api' guard — TokenGuard)
const user = await auth.guard().validate({ email, password });
auth.guard().login(request, user);

// Check authentication using default guard
const isAuthenticated = await auth.guard().check(request);

// Session-based auth for web apps
const sessionUser = await auth.guard('session').validate({ email, password });
```

### Validation

Rule-based validation.

```typescript
import { ValidatorV2 } from 'bushjs';

const validator = ValidatorV2.make(request.body, {
  name: ['required', 'min:2', 'max:50'],
  email: ['required', 'email'],
  password: ['required', 'min:8', 'confirmed'],
});

if (validator.validate()) {
  // data is valid
} else {
  const errors = validator.getErrors();
}
```

### Storage

Filesystem abstraction with disk configuration.

```typescript
import { Storage } from 'bushjs';

await Storage.disk('local').put('file.txt', 'content');
const content = await Storage.disk('local').get('file.txt');
const exists = await Storage.disk('local').exists('file.txt');
```

### API Versioning

Prefix-based versioning with deprecation support.

```typescript
import { apiVersioning, v1Route } from 'bushjs';

// Apply version extraction middleware
app.expressApp.use(apiVersioning.middleware());

// Route helpers produce version-prefixed paths
app.get(v1Route('/users'), userHandlerV1);

// Deprecation and version-requirement middleware
import { requireVersion, deprecateVersion } from 'bushjs';

app.get('/api/v2/users', requireVersion('2'), userHandlerV2);
```

### Console / CLI

The console kernel registers scaffolding generators.

```
make:controller    Generate a controller class
make:model         Generate a model class
make:middleware    Generate a middleware class
make:request       Generate a form request class
make:policy        Generate a policy class
make:schema        Generate a database schema
make:seeder        Generate a database seeder
make:command       Generate a custom CLI command
schema             Run pending schema files
seed               Run database seeders
```

### Schema & Migrations

Define MongoDB collection schemas with validation rules.

```typescript
import { BaseSchema, SchemaBuilder } from 'bushjs';

export class CreateUsersSchema extends BaseSchema {
  async up() {
    await this.createCollection('users', (schema: SchemaBuilder) => {
      schema.string('name').required();
      schema.string('email').required().unique();
      schema.string('password').required();
      schema.timestamps();
    });
  }

  async down() {
    // drop collection
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Documentation

Full documentation is available on GitHub:

- [Introduction](https://github.com/SaadMajeed565/BushJS/blob/main/docs/introduction.md)
- [Installation](https://github.com/SaadMajeed565/BushJS/blob/main/docs/installation.md)
- [Getting Started](https://github.com/SaadMajeed565/BushJS/blob/main/docs/getting-started.md)
- [Configuration](https://github.com/SaadMajeed565/BushJS/blob/main/docs/configuration.md)
- [Routing](https://github.com/SaadMajeed565/BushJS/blob/main/docs/routing.md)
- [Controllers](https://github.com/SaadMajeed565/BushJS/blob/main/docs/controllers.md)
- [Middleware](https://github.com/SaadMajeed565/BushJS/blob/main/docs/middleware.md)
- [Validation](https://github.com/SaadMajeed565/BushJS/blob/main/docs/validation.md)
- [Authentication](https://github.com/SaadMajeed565/BushJS/blob/main/docs/authentication.md)
- [Authorization](https://github.com/SaadMajeed565/BushJS/blob/main/docs/authorization.md)
- [Database](https://github.com/SaadMajeed565/BushJS/blob/main/docs/database.md)
- [GraphQL](https://github.com/SaadMajeed565/BushJS/blob/main/docs/graphql.md)
- [WebSockets](https://github.com/SaadMajeed565/BushJS/blob/main/docs/realtime-websockets.md)
- [CLI Reference](https://github.com/SaadMajeed565/BushJS/blob/main/docs/cli.md)

## Requirements

- Node.js 22+
- MongoDB 4.0+

## License

MIT License © Saad Majeed
