import type { WebSocket } from 'ws';
import { Request } from '../Http/Request';
import { auth } from '../Auth/Auth';
import type { AuthUser } from '../Auth/UserProvider';
import { JsonSocket } from './JsonSocket';

export type RealtimeGuard = 'api' | 'web';

export interface RealtimeOptions {
  /** Passed to `auth.user(request, guard)` when the socket opens. Default `api`. */
  guard?: RealtimeGuard;
  /** If true, closes the socket when no user exists after the initial auth resolution. */
  requireAuth?: boolean;
  /** Max incoming message size in bytes. Default 65536. */
  maxPayloadBytes?: number;
  /**
   * WebSocket ping interval (ms) using the `ws` isAlive pattern. 0 disables.
   * Default 30000.
   */
  pingIntervalMs?: number;
  /** Close the socket when no inbound messages for this long (ms). 0 disables. Default 0. */
  idleCloseMs?: number;
}

export const defaultRealtimeOptions: Required<RealtimeOptions> = {
  guard: 'api',
  requireAuth: false,
  maxPayloadBytes: 65536,
  pingIntervalMs: 30000,
  idleCloseMs: 0,
};

function mergeRealtimeOptions(overrides?: Partial<RealtimeOptions>): Required<RealtimeOptions> {
  return { ...defaultRealtimeOptions, ...overrides };
}

/**
 * Per-connection context: user (mutable for in-band auth), send/error, raw socket, upgrade request.
 */
export class RealtimeContext {
  /** Current user; update after e.g. `auth.userFromToken` in your `onMessage` handler. */
  user: AuthUser | null;

  constructor(
    public readonly request: Request,
    private readonly json: JsonSocket,
    initialUser: AuthUser | null
  ) {
    this.user = initialUser;
  }

  send(payload: unknown): void {
    this.json.send(payload);
  }

  error(message: string, extra: Record<string, unknown> = {}): void {
    this.json.error(message, extra);
  }

  get raw(): WebSocket {
    return this.json.raw;
  }
}

/**
 * Opinionated WebSocket handler: JSON framing, payload limit, optional ping + idle timeout,
 * and Bush `auth` on connect. Subclass {@link onMessage} (and optionally {@link onOpen} / {@link onClose}).
 *
 * Register with `app.socket('/path', YourHandler)` like a plain handler — `handle` is implemented here.
 */
export abstract class RealtimeHandler {
  /**
   * Override to tune defaults (partial merge with {@link defaultRealtimeOptions}).
   */
  protected realtimeOptions(): Partial<RealtimeOptions> {
    return {};
  }

  async handle(ws: WebSocket, request: Request): Promise<void> {
    const opts = mergeRealtimeOptions(this.realtimeOptions());
    const json = JsonSocket.wrap(ws, { maxPayloadBytes: opts.maxPayloadBytes });
    await auth.user(request, opts.guard);

    let initialUser = request.user ?? null;
    if (opts.requireAuth && !initialUser) {
      json.error('Unauthenticated');
      ws.close();
      return;
    }

    const ctx = new RealtimeContext(request, json, initialUser);

    await this.onOpen(ctx);

    let lastActivity = Date.now();
    let idleTimer: ReturnType<typeof setInterval> | undefined;
    if (opts.idleCloseMs > 0) {
      const tick = Math.min(opts.idleCloseMs, 10_000);
      idleTimer = setInterval(() => {
        if (Date.now() - lastActivity > opts.idleCloseMs) {
          try {
            ws.close();
          } catch {
            /* noop */
          }
        }
      }, tick);
    }

    let pingTimer: ReturnType<typeof setInterval> | undefined;
    if (opts.pingIntervalMs > 0) {
      let isAlive = true;
      ws.on('pong', () => {
        isAlive = true;
      });
      pingTimer = setInterval(() => {
        if (!isAlive) {
          try {
            ws.terminate();
          } catch {
            /* noop */
          }
          return;
        }
        isAlive = false;
        try {
          ws.ping();
        } catch {
          /* closed */
        }
      }, opts.pingIntervalMs);
    }

    const cleanup = () => {
      if (idleTimer) {
        clearInterval(idleTimer);
      }
      if (pingTimer) {
        clearInterval(pingTimer);
      }
    };

    json.onMessage(async (msg) => {
      lastActivity = Date.now();
      await this.onMessage(ctx, msg);
    });

    json.onClose(() => {
      cleanup();
      void this.onClose(ctx);
    });
  }

  async onOpen(_ctx: RealtimeContext): Promise<void> {}

  abstract onMessage(ctx: RealtimeContext, msg: Record<string, unknown>): Promise<void>;

  async onClose(_ctx: RealtimeContext): Promise<void> {}
}
