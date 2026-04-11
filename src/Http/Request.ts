import { IncomingMessage } from 'http';
import express from 'express';

export class Request {
  method: string;
  path: string;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string | string[]>;
  params: Record<string, string> = {};
  session?: any;
  user?: any;
  userId?: string;
  token?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;

  constructor(
    method: string,
    path: string,
    query: Record<string, string>,
    body: any,
    headers: Record<string, string | string[]>,
    session?: any,
    user?: any
  ) {
    this.method = method;
    this.path = path;
    this.query = query;
    this.body = body;
    this.headers = headers;
    this.session = session;
    this.user = user;
  }

  static async fromNode(nodeReq: IncomingMessage): Promise<Request> {
    const url = new URL(nodeReq.url ?? '/', `http://${nodeReq.headers.host ?? 'localhost'}`);
    const body = await new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];

      nodeReq.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      nodeReq.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'));
      });

      nodeReq.on('error', () => {
        resolve('');
      });
    });

    let parsedBody: any = body;
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

  static async fromExpress(expressReq: express.Request): Promise<Request> {
    const request = new Request(
      expressReq.method,
      expressReq.path,
      expressReq.query as Record<string, string>,
      expressReq.body,
      expressReq.headers as Record<string, string | string[]>,
      (expressReq as any).session,
      (expressReq as any).user
    );
    request.file = (expressReq as any).file;
    request.files = (expressReq as any).files;
    return request;
  }

  input(key: string, fallback: any = null): any {
    return this.body[key] ?? this.query[key] ?? fallback;
  }

  all(): Record<string, any> {
    return { ...this.body, ...this.query };
  }

  only(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
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
    const xForwardedFor = this.header('x-forwarded-for');
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return xForwardedFor?.[0];
  }

  has(key: string): boolean {
    return this.input(key) !== undefined;
  }
}