# Authorization

Bush.js provides policy-based authorization through `gate`.

## Define a policy

```ts
import { Policy } from 'bushjs';

export class PostPolicy implements Policy {
  viewAny(user: any): boolean {
    return !!user;
  }

  update(user: any, post: any): boolean {
    return user.id === String(post.author_id);
  }

  delete(user: any, post: any): boolean {
    return user.role === 'admin' || user.id === String(post.author_id);
  }
}
```

## Register policy with `gate`

```ts
import { gate } from 'bushjs';

gate.define('Post', new PostPolicy());
```

`gate` resolves policy keys by:

- explicit model string (`'Post'`)
- or `model.constructor.name`

## Use `gate` directly

```ts
const allowed = await gate.allows(request.user, 'update', post);
if (!allowed) {
  response.status(403).json({ message: 'Forbidden' });
  return;
}
```

Or throw directly:

```ts
await gate.authorize(request.user, 'update', post);
```

## Use controller helpers

If your controller extends `Controller`:

```ts
await this.authorize(request, 'update', post);
```

or:

```ts
const canDelete = await this.can(request, 'delete', post);
```

## Supported policy methods

- `viewAny(user)`
- `view(user, model)`
- `create(user)`
- `update(user, model)`
- `delete(user, model)`

## Authorization Workflow

1. Define policy per model/domain object
2. Register policy in app bootstrap
3. Enforce authorization in controllers before mutation actions
4. Keep authorization logic inside policies, not controllers

---
**Previous:** [Authentication](authentication.md) | **Next:** [Database](database.md)
