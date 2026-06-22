"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeHandler = exports.RealtimeContext = exports.defaultRealtimeOptions = void 0;
const Auth_1 = require("../Auth/Auth");
const JsonSocket_1 = require("./JsonSocket");
exports.defaultRealtimeOptions = {
    guard: 'api',
    requireAuth: false,
    maxPayloadBytes: 65536,
    pingIntervalMs: 30000,
    idleCloseMs: 0,
};
function mergeRealtimeOptions(overrides) {
    return { ...exports.defaultRealtimeOptions, ...overrides };
}
/**
 * Per-connection context: user (mutable for in-band auth), send/error, raw socket, upgrade request.
 */
class RealtimeContext {
    constructor(request, json, initialUser) {
        this.request = request;
        this.json = json;
        this.user = initialUser;
    }
    send(payload) {
        this.json.send(payload);
    }
    error(message, extra = {}) {
        this.json.error(message, extra);
    }
    get raw() {
        return this.json.raw;
    }
}
exports.RealtimeContext = RealtimeContext;
/**
 * Opinionated WebSocket handler: JSON framing, payload limit, optional ping + idle timeout,
 * and Bush `auth` on connect. Subclass {@link onMessage} (and optionally {@link onOpen} / {@link onClose}).
 *
 * Register with `app.socket('/path', YourHandler)` like a plain handler — `handle` is implemented here.
 */
class RealtimeHandler {
    /**
     * Override to tune defaults (partial merge with {@link defaultRealtimeOptions}).
     */
    realtimeOptions() {
        return {};
    }
    async handle(ws, request) {
        const opts = mergeRealtimeOptions(this.realtimeOptions());
        const json = JsonSocket_1.JsonSocket.wrap(ws, { maxPayloadBytes: opts.maxPayloadBytes });
        await Auth_1.auth.user(request, opts.guard);
        let initialUser = request.user ?? null;
        if (opts.requireAuth && !initialUser) {
            json.error('Unauthenticated');
            ws.close();
            return;
        }
        const ctx = new RealtimeContext(request, json, initialUser);
        await this.onOpen(ctx);
        let lastActivity = Date.now();
        let idleTimer;
        if (opts.idleCloseMs > 0) {
            const tick = Math.min(opts.idleCloseMs, 10000);
            idleTimer = setInterval(() => {
                if (Date.now() - lastActivity > opts.idleCloseMs) {
                    try {
                        ws.close();
                    }
                    catch {
                        /* noop */
                    }
                }
            }, tick);
        }
        let pingTimer;
        if (opts.pingIntervalMs > 0) {
            let isAlive = true;
            ws.on('pong', () => {
                isAlive = true;
            });
            pingTimer = setInterval(() => {
                if (!isAlive) {
                    try {
                        ws.terminate();
                    }
                    catch {
                        /* noop */
                    }
                    return;
                }
                isAlive = false;
                try {
                    ws.ping();
                }
                catch {
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
    async onOpen(_ctx) { }
    async onClose(_ctx) { }
}
exports.RealtimeHandler = RealtimeHandler;
//# sourceMappingURL=RealtimeHandler.js.map