# Realtime and WebSockets

Bush.js supports socket routes via `Application.socket(path, handler)`.

You can register:

- a function handler `(ws, request) => {}`
- a class with `handle(ws, request)`
- a subclass of `RealtimeHandler` for JSON protocol + optional auth/ping/idle handling

## Minimal socket route

```ts
app.socket('/ws/echo', async (ws, _request) => {
  ws.on('message', (data) => ws.send(String(data)));
});
```

## `RealtimeHandler` (recommended)

`RealtimeHandler` adds:

- JSON message framing (`JsonSocket`)
- max payload guard
- optional auth requirement
- websocket ping/pong liveness
- optional idle timeout

```ts
import { RealtimeHandler, RealtimeContext } from 'bushjs';

export class ChatHandler extends RealtimeHandler {
  protected realtimeOptions() {
    return {
      guard: 'api',
      requireAuth: true,
      maxPayloadBytes: 64 * 1024,
      pingIntervalMs: 30_000,
    };
  }

  async onOpen(ctx: RealtimeContext): Promise<void> {
    ctx.send({ type: 'welcome', userId: ctx.user?.id ?? null });
  }

  async onMessage(ctx: RealtimeContext, msg: Record<string, unknown>): Promise<void> {
    if (msg.type === 'ping') {
      ctx.send({ type: 'pong' });
      return;
    }

    if (msg.type === 'chat') {
      ctx.send({ type: 'chat.ack', text: msg.text ?? '' });
      return;
    }

    ctx.error('Unknown event');
  }
}

app.socket('/ws/chat', ChatHandler);
```

## In-band socket auth

For custom auth messages (`{ type: "auth", token }`), use:

```ts
const user = await auth.userFromToken(tokenString, 'api');
ctx.user = user;
```

This reuses `TokenGuard` JWT verification logic.

## Note on route middleware

Socket routes currently do not auto-run route middleware arrays. Perform auth/authorization checks in your socket handler (or via `RealtimeHandler` options and logic).

## Realtime Design Guidelines

- Define a clear message contract (`type`, payload shape)
- Authenticate early when connection opens
- Send structured error payloads for client handling
- Keep each handler bounded to one domain/protocol concern

---
**Previous:** [GraphQL](graphql.md) | **Next:** [Command Reference](cli.md)
