# Database

Bush.js integrates with MongoDB through:

- `Connection`
- `Model` / `QueryBuilder`
- `BaseSchema` / `SchemaBuilder`
- `Seeder`

## Define a model

```ts
import { Model } from 'bushjs';

export class User extends Model {
  static collection = 'users';
  static fields = {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true, unique: true },
    password: { type: 'string', required: true },
    role: { type: 'string', required: true },
  };
}
```

## Query examples

```ts
const users = await User.all();
const user = await User.find('507f1f77bcf86cd799439011');
const firstAdmin = await User.where('role', 'admin').first();

const created = await User.create({
  name: 'Saad',
  email: 'saad@example.com',
  password: 'hashed',
  role: 'admin',
});

const updated = await User.update(created._id, { role: 'editor' });
await User.delete(created._id);
```

## Pagination

```ts
const page = await User.paginate(1, 20);
// { data, total, page, perPage }
```

## Relationships

```ts
export class Post extends Model {
  static collection = 'posts';
  static fields = {
    title: { type: 'string', required: true },
    body: { type: 'string', required: true },
    user_id: { type: 'objectId', required: true },
  };
}

const postsForUser = await User.hasMany(Post, 'user_id').get(userId);
const owner = await Post.belongsTo(User, 'user_id').get(userId);
```

## Schemas (migrations-like workflow)

```ts
import { BaseSchema, SchemaBuilder } from 'bushjs';

export default class CreateUsersSchema extends BaseSchema {
  async up(): Promise<void> {
    await this.createCollection('users', (schema: SchemaBuilder) => {
      schema.string('name', 255, true);
      schema.string('email', 255, true).unique();
      schema.string('password', 255, true);
      schema.string('role', 50, true);
      schema.timestamps();
      schema.index(['email']);
    });
  }

  async down(): Promise<void> {
    await this.dropCollection('users');
  }
}
```

## Seeders

```ts
import { Seeder } from 'bushjs';

export default class UserSeeder extends Seeder {
  async run(): Promise<void> {
    await User.create({
      name: 'Admin',
      email: 'admin@site.test',
      password: 'hashed-password',
      role: 'admin',
    });
  }
}
```

## Database Workflow

1. Define or update schema files for collection shape/indexes
2. Create/update models to map domain entities
3. Use query/model APIs in controllers/services
4. Use seeders for local/dev bootstrap data

---
**Previous:** [Authorization](authorization.md) | **Next:** [GraphQL](graphql.md)
