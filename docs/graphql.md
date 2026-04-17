# GraphQL

Bush.js supports GraphQL route registration through `Application.graphql`.

## Register a GraphQL endpoint

```ts
import { Application } from 'bushjs';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const app = new Application();

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hello: {
      type: GraphQLString,
      resolve: () => 'Hello GraphQL',
    },
  },
});

app.graphql('/graphql', new GraphQLSchema({ query }));
```

## Add middleware to GraphQL route

```ts
import { AuthMiddleware } from 'bushjs';

app.graphql('/graphql', schema, rootValue, [new AuthMiddleware('api')]);
```

## Build custom GraphQL context

`Application.graphql` accepts `buildContext(request)` as a 5th argument.

```ts
app.graphql(
  '/graphql',
  schema,
  rootValue,
  [new AuthMiddleware('api')],
  async (request) => ({
    user: request.user,
    requestId: request.header('x-request-id'),
  })
);
```

In resolvers, you can use `context.request` and your custom fields.

## Auth behavior

Before context creation, Bush.js tries `auth.user(request, 'api')`, so JWT bearer users can be available as `request.user` when token is valid.

## GraphQL Usage Notes

- Keep transport concerns in route registration
- Keep business rules in resolvers/services
- Enforce resolver-level auth for sensitive operations

---
**Previous:** [Database](database.md) | **Next:** [Realtime & WebSockets](realtime-websockets.md)
