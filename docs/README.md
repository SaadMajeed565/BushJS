# Bush.js

Bush.js is a Node.js framework built on top of Express.js and MongoDB (with TypeScript). It gives you routing, middleware, validation, authentication, and a clear place for your application code. You can also add GraphQL or WebSockets when your project needs them.

## Quick start

```bash
npm install -g bushjs-cli
bush new my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

With MongoDB running, open `http://localhost:3000/health` to confirm the app is up.

---

## Documentation

### Getting started

- [Introduction](introduction.md)
- [Installation](installation.md)
- [Getting started](getting-started.md)

### Basics

- [Basics](basics.md)
- [Basics overview](basics-overview.md)
- [Project structure](project-structure.md)
- [App directory](app-directory.md)
- [Configuration](configuration.md)
- [Routing](routing.md)
- [Controllers](controllers.md)
- [Middleware](middleware.md)
- [Validation](validation.md)
- [Authentication](authentication.md)
- [Authorization](authorization.md)
- [Database](database.md)
- [GraphQL](graphql.md)
- [Realtime & WebSockets](realtime-websockets.md)
- [Command reference](cli.md)
- [Generators](generators.md)

### Advanced

- [Advanced](advanced.md)
- [Advanced custom architecture](advanced-custom-architecture.md)

---

**Continue with the full documentation:** [Introduction](introduction.md)
