# Generators

In Bush.js apps, generators are run via the **framework console**, not via `bush` directly.

Use:

```bash
npm run bush <command>
```
Or
```bash
node bush <command>
```

## Common generator commands

### Model

```bash
npm run bush make:model Product
```
Or
```bash
node bush make:model Product
```

Creates a model under `app/Models/`.

### Controller

```bash
npm run bush make:controller ProductController
```
Or
```bash
node bush make:controller ProductController
```

Creates `app/Http/Controllers/ProductController.ts`.

### Middleware

```bash
npm run bush make:middleware EnsureAdmin
```
Or
```bash
node bush make:middleware EnsureAdmin
```

Creates `app/Http/Middleware/EnsureAdmin.ts`.

### Request

```bash
npm run bush make:request StoreProductRequest
```
Or
```bash
node bush make:request StoreProductRequest
```

Creates `app/Http/Requests/StoreProductRequest.ts`.

### Policy

```bash
npm run bush make:policy ProductPolicy
```
Or
```bash
node bush make:policy ProductPolicy
```

Creates `app/Policies/ProductPolicy.ts`.

### Schema / migration-style file

```bash
npm run bush make:schema create_products
```
Or
```bash
node bush make:schema create_products
```

Creates a schema file under `database/schemas/`.

### Seeder

```bash
npm run bush make:seeder ProductSeeder
```
Or
```bash
node bush make:seeder ProductSeeder
```

Creates a seeder file under `database/seeders/` (if configured by your app setup).

## Run generated data workflows

```bash
npm run bush schema
npm run bush seed
```
Or
```bash
node bush schema
node bush seed
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
