import { IncomingMessage } from 'http';
import express from 'express';

const DEFAULT_MAX_BODY_BYTES = 10 * 1024 * 1024;

export class Request<TUser = unknown> {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[]>;
  params: Record<string, string> = {};
  session?: Record<string, unknown>;
  user?: TUser;
  userId?: string;
  token?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  private clientIp?: string;
  readonly expressRequest?: express.Request;
  private static maxBodyBytes = DEFAULT_MAX_BODY_BYTES;

  constructor(
    method: string,
    path: string,
    query: Record<string, string>,
    body: unknown,
    headers: Record<string, string | string[]>,
    session?: Record<string, unknown>,
    user?: TUser
  ) {
    this.method = method;
    this.path = path;
    this.query = query;
    this.body = body;
    this.headers = headers;
    this.session = session;
    this.user = user;
  }

  static setMaxBodyBytes(bytes: number): void {
    Request.maxBodyBytes = bytes;
  }

  static async fromNode(nodeReq: IncomingMessage): Promise<Request> {
    const url = new URL(nodeReq.url ?? '/', `http://${nodeReq.headers.host ?? 'localhost'}`);
    const body = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      nodeReq.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > Request.maxBodyBytes) {
          nodeReq.destroy(new Error('Request body too large'));
          reject(new Error('Request body too large'));
          return;
        }
        chunks.push(chunk);
      });

      nodeReq.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      });

      nodeReq.on('error', (err) => {
        reject(err);
      });
    });

    let parsedBody: unknown = body;
    if (body.length > 0) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return new Request(
      nodeReq.method ?? 'GET',
      url.pathname,
      query,
      parsedBody,
      nodeReq.headers as Record<string, string | string[]>
    );
  }

  private static cacheKey = Symbol('bushjs_request');

  static async fromExpress(expressReq: express.Request): Promise<Request> {
    const expressAny = expressReq as unknown as Record<string, unknown>;

    const cached = (expressAny as any)[Request.cacheKey] as Request | undefined;
    if (cached) return cached;

    const session = expressReq.session
      ? (expressReq.session as unknown as Record<string, unknown>)
      : undefined;

    const request = new Request(
      expressReq.method,
      expressReq.path,
      expressReq.query as Record<string, string>,
      expressReq.body,
      expressReq.headers as Record<string, string | string[]>,
      session,
      expressAny.user as Record<string, unknown> | undefined
    );

    (request as any).expressRequest = expressReq;
    request.clientIp = expressReq.ip;
    request.params = expressReq.params as Record<string, string>;

    if (typeof expressAny.userId === 'string') {
      request.userId = expressAny.userId;
    }

    if (typeof expressAny.token === 'string') {
      request.token = expressAny.token;
    }

    if (expressAny.file) {
      request.file = expressAny.file as Express.Multer.File;
    }

    if (expressAny.files) {
      request.files = expressAny.files as Express.Multer.File[] | Record<string, Express.Multer.File[]>;
    }

    (expressAny as any)[Request.cacheKey] = request;
    return request;
  }

  input(key: string, fallback: unknown = null): unknown {
    if (typeof this.body === 'object' && this.body !== null) {
      return (this.body as Record<string, unknown>)[key] ?? this.query[key] ?? fallback;
    }
    return this.query[key] ?? fallback;
  }

  all(): Record<string, unknown> {
    const body = typeof this.body === 'object' && this.body !== null
      ? (this.body as Record<string, unknown>)
      : {};
    return { ...body, ...this.query };
  }

  only(keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    keys.forEach(key => {
      result[key] = this.input(key);
    });
    return result;
  }

  header(key: string): string | string[] | undefined {
    return this.headers[key.toLowerCase()];
  }

  url(): string {
    return `${this.method} ${this.path}`;
  }

  ip(): string | undefined {
    if (this.clientIp && this.clientIp.trim()) {
      return this.clientIp.trim();
    }

    const xForwardedFor = this.header('x-forwarded-for');
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return xForwardedFor?.[0];
  }

  has(key: string): boolean {
    return this.input(key) !== undefined && this.input(key) !== null;
  }
}
