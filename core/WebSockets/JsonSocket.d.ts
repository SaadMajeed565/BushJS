import type { WebSocket } from 'ws';
export type JsonSocketWrapOptions = {
    /** Reject incoming frames larger than this (bytes). Omit for no limit. */
    maxPayloadBytes?: number;
};
/**
 * Wraps a `ws` WebSocket for JSON object protocols (auth, commands, events).
 * Use from `handle(ws, request)` via {@link JsonSocket.wrap}.
 */
export declare class JsonSocket {
    private readonly ws;
    private readonly maxPayloadBytes;
    constructor(ws: WebSocket, maxPayloadBytes?: number | null);
    /** Raw socket (e.g. for room registries that store `WebSocket` instances). */
    get raw(): WebSocket;
    send(payload: unknown): void;
    /** Sends `{ type: 'error', message, ...extra }`. */
    error(message: string, extra?: Record<string, unknown>): void;
    /**
     * Parses each message as a JSON object. Invalid JSON or non-objects yield {@link error}.
     * Handler errors are caught and surfaced as `error` messages.
     */
    onMessage(handler: (msg: Record<string, unknown>) => void | Promise<void>): void;
    onClose(handler: () => void): void;
    static wrap(ws: WebSocket, options?: JsonSocketWrapOptions): JsonSocket;
}
//# sourceMappingURL=JsonSocket.d.ts.map