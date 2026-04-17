# App Directory

`app/` is the main development surface of your application.

## `app/Http/Controllers`

Use controllers to coordinate request handling:

- read input and params
- validate/authorize operations
- call model/service code
- return `Response`

```ts
export class UserController {
  async show(request, response) {
    response.json({ id: request.params.id });
  }
}
```

## `app/Http/Middleware`

Use middleware for cross-cutting policies:

- authentication
- role checks
- rate or abuse protection
- contextual request guards

## `app/Http/Requests`

Use request classes for validation/authorization logic to keep controller methods focused on behavior.

## `app/Models`

Use models for persistence and query behavior:

```ts
export class Product extends Model {
  static collection = 'products';
  static fields = {
    name: { type: 'string', required: true },
    price: { type: 'int', required: true },
  };
}
```

## `app/Policies`

Use policies for action-level access control:

```ts
export class ProductPolicy {
  update(user, product) {
    return user.role === 'admin' || user.id === String(product.owner_id);
  }
}
```

## `app/GraphQL`

GraphQL schema/resolver code for query and mutation surfaces.

## `app/WebSockets`

Realtime handlers and event protocol logic.

## Recommended Layering

- Route -> Middleware -> Controller
- Controller -> Validation/Auth/Policy checks
- Controller -> Model/Service
- Controller -> Response

---
**Previous:** [Project Structure](project-structure.md) | **Next:** [Configuration](configuration.md)
