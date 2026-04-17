# Advanced Custom Architecture

This guide is part of the **Advanced** track and is for teams that want to build their own folder structure and architecture with core APIs.

## When to use this approach

Use custom architecture if you need:

- monorepo integration with existing service layout
- domain-driven folders (`modules/`, `services/`, `packages/`, etc.)
- a migration path from another framework with minimal folder changes

For most projects, the Basics structure is still the best default.

## Minimal custom bootstrap

```ts
import 'dotenv/config';
import { Application } from 'bushjs';

const app = new Application({
  basePath: process.cwd(),
  databaseUrl: process.env.DATABASE_URL,
});

app.get('/health', async (_request, response) => {
  response.json({ ok: true });
});

app.listen(Number(process.env.PORT || 3000));
```

## Example custom folder layout

```text
my-service/
  src/
    bootstrap/
      app.ts
      auth.ts
      policies.ts
    modules/
      users/
        users.routes.ts
        users.controller.ts
        users.model.ts
      billing/
        billing.routes.ts
        billing.controller.ts
  config/
  scripts/
  package.json
```

## Register routes from modules

```ts
import { Application } from 'bushjs';
import { registerUserRoutes } from './modules/users/users.routes';
import { registerBillingRoutes } from './modules/billing/billing.routes';

export function registerRoutes(app: Application): void {
  registerUserRoutes(app);
  registerBillingRoutes(app);
}
```

## Auth and policy setup in custom apps

You still use the same framework APIs:

- `auth.setUserProvider(...)`
- `gate.define('ModelName', policyInstance)`
- `new AuthMiddleware('api' | 'web')`

So only your folder organization changes; auth/validation/routing APIs stay identical.

## Practical recommendation

Start with Basics first, then extract modules gradually if needed. This keeps onboarding easy while allowing advanced architecture later.

---
**Previous:** [Advanced Overview](advanced.md) | **Next:** [Docs Home](README.md)
