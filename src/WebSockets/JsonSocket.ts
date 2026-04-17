import type { RawData, WebSocket } from 'ws';

const OPEN = 1;

function rawDataByteLength(data: RawData): number {
  if (typeof data === 'string') return Buffer.byteLength(data);
  if (Buffer.isBuffer(data)) return data.length;
  if (ArrayBuffer.isView(data)) return data.byteLength;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (Array.isArray(data)) {
    let n = 0;
    for (const b of data) n += b.length;
    return n;
  }
  return 0;
}

function rawDataToUtf8(data: RawData): string {
  if (typeof data === 'string') return data;
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
  }
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  return '';
}

export type JsonSocketWrapOptions = {
  /** Reject incoming frames larger than this (bytes). Omit for no limit. */
  maxPayloadBytes?: number;
};

/**
 * Wraps a `ws` WebSocket for JSON object protocols (auth, commands, events).
 * Use from `handle(ws, request)` via {@link JsonSocket.wrap}.
 */
export class JsonSocket {
  constructor(
    private readonly ws: WebSocket,
    private readonly maxPayloadBytes: number | null = null
  ) {}

  /** Raw socket (e.g. for room registries that store `WebSocket` instances). */
  get raw(): WebSocket {
    return this.ws;
  }

  send(payload: unknown): void {
    if (this.ws.readyState !== OPEN) {
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }

  /** Sends `{ type: 'error', message, ...extra }`. */
  error(message: string, extra: Record<string, unknown> = {}): void {
    this.send({ type: 'error', message, ...extra });
  }

  /**
   * Parses each message as a JSON object. Invalid JSON or non-objects yield {@link error}.
   * Handler errors are caught and surfaced as `error` messages.
   */
  onMessage(handler: (msg: Record<string, unknown>) => void | Promise<void>): void {
    this.ws.on('message', async (buf) => {
      if (this.maxPayloadBytes != null && rawDataByteLength(buf) > this.maxPayloadBytes) {
        this.error('Message too large');
        return;
      }

      let msg: Record<string, unknown>;
      try {
        const parsed = JSON.parse(rawDataToUtf8(buf)) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          this.error('Expected a JSON object');
          return;
        }
        msg = parsed as Record<string, unknown>;
      } catch {
        this.error('Invalid JSON');
        return;
      }
      try {
        await handler(msg);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Handler failed';
        this.error(message);
      }
    });
  }

  onClose(handler: () => void): void {
    this.ws.on('close', handler);
  }

  static wrap(ws: WebSocket, options?: JsonSocketWrapOptions): JsonSocket {
    const max = options?.maxPayloadBytes;
    return new JsonSocket(ws, max == null ? null : max);
  }
}
