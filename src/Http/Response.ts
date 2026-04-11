import { ServerResponse } from 'http';
import express from 'express';

export class Response {
  private serverResponse?: ServerResponse;
  private expressResponse?: express.Response;
  private sent = false;

  constructor(response: ServerResponse | express.Response) {
    if (response && 'setHeader' in response && 'end' in response) {
      this.serverResponse = response as ServerResponse;
    } else {
      this.expressResponse = response as express.Response;
    }
  }

  status(code: number): this {
    if (this.expressResponse) {
      this.expressResponse.status(code);
    } else if (this.serverResponse) {
      this.serverResponse.statusCode = code;
    }
    return this;
  }

  header(key: string, value: string): this {
    if (this.expressResponse) {
      this.expressResponse.set(key, value);
    } else if (this.serverResponse) {
      this.serverResponse.setHeader(key, value);
    }
    return this;
  }

  send(body: any): void {
    if (this.sent) {
      return;
    }

    this.sent = true;

    if (this.expressResponse) {
      this.expressResponse.send(body);
    } else if (this.serverResponse) {
      if (typeof body === 'object') {
        this.header('Content-Type', 'application/json');
        this.serverResponse.end(JSON.stringify(body, null, 2));
        return;
      }
      this.serverResponse.end(String(body));
    }
  }

  json(body: any): void {
    if (this.expressResponse) {
      this.expressResponse.json(body);
    } else {
      this.header('Content-Type', 'application/json');
      this.send(body);
    }
  }

  redirect(url: string, statusCode = 302): void {
    if (this.expressResponse) {
      this.expressResponse.redirect(statusCode, url);
    } else {
      this.status(statusCode);
      this.header('Location', url);
      this.send(`Redirecting to ${url}`);
    }
  }

  html(content: string): void {
    if (this.expressResponse) {
      this.expressResponse.type('html').send(content);
    } else {
      this.header('Content-Type', 'text/html');
      this.send(content);
    }
  }

  cookie(name: string, value: string, options: any = {}): this {
    if (this.expressResponse) {
      this.expressResponse.cookie(name, value, options);
    } else if (this.serverResponse) {
      const cookieStr = this.buildCookieString(name, value, options);
      this.serverResponse.setHeader('Set-Cookie', cookieStr);
    }
    return this;
  }

  private buildCookieString(name: string, value: string, options: any = {}): string {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }
    if (options.path) {
      cookie += `; Path=${options.path}`;
    }
    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }
    if (options.secure) {
      cookie += '; Secure';
    }
    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }
    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    return cookie;
  }
}
