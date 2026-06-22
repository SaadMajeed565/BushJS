import type { WebSocket } from 'ws';
import { Request } from '../Http/Request';
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
export declare const defaultRealtimeOptions: Required<RealtimeOptions>;
/**
 * Per-connection context: user (mutable for in-band auth), send/error, raw socket, upgrade request.
 */
export declare class RealtimeContext {
    readonly request: Request;
    private readonly json;
    /** Current user; update after e.g. `auth.userFromToken` in your `onMessage` handler. */
    user: AuthUser | null;
    constructor(request: Request, json: JsonSocket, initialUser: AuthUser | null);
    send(payload: unknown): void;
    error(message: string, extra?: Record<string, unknown>): void;
    get raw(): WebSocket;
}
/**
 * Opinionated WebSocket handler: JSON framing, payload limit, optional ping + idle timeout,
 * and Bush `auth` on connect. Subclass {@link onMessage} (and optionally {@link onOpen} / {@link onClose}).
 *
 * Register with `app.socket('/path', YourHandler)` like a plain handler — `handle` is implemented here.
 */
export declare abstract class RealtimeHandler {
    /**
     * Override to tune defaults (partial merge with {@link defaultRealtimeOptions}).
     */
    protected realtimeOptions(): Partial<RealtimeOptions>;
    handle(ws: WebSocket, request: Request): Promise<void>;
    onOpen(_ctx: RealtimeContext): Promise<void>;
    abstract onMessage(ctx: RealtimeContext, msg: Record<string, unknown>): Promise<void>;
    onClose(_ctx: RealtimeContext): Promise<void>;
}
//# sourceMappingURL=RealtimeHandler.d.ts.map