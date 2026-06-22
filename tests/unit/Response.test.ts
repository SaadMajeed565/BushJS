import { Response } from '../../src/Http/Response';
import { ServerResponse } from 'http';

function mockExpressRes(): any {
  const chunks: any[] = [];
  return {
    req: {},
    statusCode: 200,
    _headers: {} as Record<string, string>,
    status(code: number) { this.statusCode = code; return this; },
    set(key: string, value: string) { this._headers[key] = value; },
    json(body: any) { chunks.push(JSON.stringify(body)); },
    send(body?: any) { chunks.push(body); },
    redirect(status: number | string, url?: string) {
      if (typeof status === 'number') { this.statusCode = status; this._headers['Location'] = url!; }
      else { this._headers['Location'] = status; }
    },
    type(_t: string) { return this; },
    cookie(name: string, value: string, _opts?: any) { this._headers[`cookie:${name}`] = value; },
    get written() { return chunks; },
  };
}

describe('Response', () => {
  describe('with Express response', () => {
    it('sets status code', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.status(201);
      expect(expressRes.statusCode).toBe(201);
    });

    it('sets header', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.header('X-Custom', 'value');
      expect(expressRes._headers['X-Custom']).toBe('value');
    });

    it('sends JSON body', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.json({ ok: true });
      expect(expressRes.written[0]).toBe('{"ok":true}');
    });

    it('sends raw body', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.send('hello');
      expect(expressRes.written[0]).toBe('hello');
    });

    it('sends empty body', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.send();
      expect(expressRes.written[0]).toBeUndefined();
    });

    it('prevents duplicate send', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.send('first');
      res.send('second');
      expect(expressRes.written).toHaveLength(1);
    });

    it('redirects with status', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.redirect('/login', 302);
      expect(expressRes.statusCode).toBe(302);
      expect(expressRes._headers['Location']).toBe('/login');
    });

    it('sends HTML', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.html('<h1>Hello</h1>');
      expect(expressRes.written[0]).toBe('<h1>Hello</h1>');
    });

    it('sets cookies', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      res.cookie('session', 'abc123', { httpOnly: true, maxAge: 3600 });
      expect(expressRes._headers['cookie:session']).toBe('abc123');
    });
  });

  describe('with raw ServerResponse', () => {
    it('sets status code', () => {
      const raw = new ServerResponse({} as any);
      const res = new Response(raw);
      res.status(404);
      expect(raw.statusCode).toBe(404);
    });

    it('sets header', () => {
      const raw = new ServerResponse({} as any);
      const res = new Response(raw);
      res.header('X-Test', 'yes');
      expect(raw.getHeader('X-Test')).toBe('yes');
    });

    it('sends JSON body with content-type', () => {
      const raw = new ServerResponse({} as any);
      const res = new Response(raw);
      res.json({ a: 1 });
      expect(raw.getHeader('Content-Type')).toBe('application/json');
    });

    it('sends empty body', () => {
      const raw = new ServerResponse({} as any);
      const res = new Response(raw);
      res.send();
      expect(raw.statusCode).toBe(200);
    });
  });

  describe('constructor type detection', () => {
    it('detects Express response by set method', () => {
      const expressRes = mockExpressRes();
      const res = new Response(expressRes as any);
      expect((res as any).expressResponse).toBeDefined();
      expect((res as any).serverResponse).toBeUndefined();
    });

    it('treats raw ServerResponse as server response', () => {
      const raw = new ServerResponse({} as any);
      const res = new Response(raw);
      expect((res as any).serverResponse).toBeDefined();
      expect((res as any).expressResponse).toBeUndefined();
    });
  });
});
