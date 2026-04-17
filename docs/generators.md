# Generators

In Bush.js apps, generators are run via the **framework console**, not via `bush` directly.

Use:

```bash
npm run bush:console -- <command>
```

## Common generator commands

### Model

```bash
npm run bush:console -- make:model Product
```

Creates a model under `app/Models/`.

### Controller

```bash
npm run bush:console -- make:controller ProductController
```

Creates `app/Http/Controllers/ProductController.ts`.

### Middleware

```bash
npm run bush:console -- make:middleware EnsureAdmin
```

Creates `app/Http/Middleware/EnsureAdmin.ts`.

### Request

```bash
npm run bush:console -- make:request StoreProductRequest
```

Creates `app/Http/Requests/StoreProductRequest.ts`.

### Policy

```bash
npm run bush:console -- make:policy ProductPolicy
```

Creates `app/Policies/ProductPolicy.ts`.

### Schema / migration-style file

```bash
npm run bush:console -- make:schema create_products
```

Creates a schema file under `database/schemas/`.

### Seeder

```bash
npm run bush:console -- make:seeder ProductSeeder
```

Creates a seeder file under `database/seeders/` (if configured by your app setup).

## Run generated data workflows

```bash
npm run bush:console -- schema
npm run bush:console -- seed
```

## Practical workflow

1. `make:model Product`
2. `make:controller ProductController`
3. `make:request StoreProductRequest`
4. add route in `routes/api.ts`
5. protect with middleware/policy

## Generator Best Practices

- Generate first, then tailor each file to your domain
- Keep generated names resource-driven (`User`, `Order`, `Invoice`)
- Pair controller generation with request and policy generation

---
**Previous:** [Command Reference](cli.md) | **Next:** [Advanced Overview](advanced.md)
