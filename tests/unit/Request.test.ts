import { Request } from '../../src/Http/Request';

function mockExpressReq(overrides: Record<string, any> = {}): any {
  return {
    method: 'POST',
    path: '/users',
    query: { page: '2' },
    body: { name: 'John' },
    headers: { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    params: { id: '42' },
    ip: '127.0.0.1',
    session: { userId: 'abc' },
    user: { id: 'abc', name: 'John' },
    userId: 'abc',
    token: 'jwt-token',
    ...overrides,
  };
}

describe('Request', () => {
  describe('fromExpress', () => {
    it('creates request from Express req', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.method).toBe('POST');
      expect(req.path).toBe('/users');
    });

    it('captures query parameters', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.query).toEqual({ page: '2' });
    });

    it('captures body', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.body).toEqual({ name: 'John' });
    });

    it('captures headers', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.header('content-type')).toBe('application/json');
    });

    it('captures session and user', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect((req as any).session.userId).toBe('abc');
      expect((req as any).user).toEqual({ id: 'abc', name: 'John' });
    });

    it('captures userId and token', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.userId).toBe('abc');
      expect(req.token).toBe('jwt-token');
    });

    it('captures file uploads', async () => {
      const file = { fieldname: 'avatar' } as Express.Multer.File;
      const req = await Request.fromExpress(mockExpressReq({ file }));
      expect(req.file).toBe(file);
    });

    it('captures params', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.params).toEqual({ id: '42' });
    });
  });

  describe('input', () => {
    it('returns value from body', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.input('name')).toBe('John');
    });

    it('falls back to query', async () => {
      const req = await Request.fromExpress(mockExpressReq({ body: {} }));
      expect(req.input('page')).toBe('2');
    });

    it('returns fallback for missing key', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.input('nonexistent', 'default')).toBe('default');
    });
  });

  describe('all', () => {
    it('merges body and query', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.all()).toEqual({ name: 'John', page: '2' });
    });
  });

  describe('only', () => {
    it('returns only specified keys', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.only(['name'])).toEqual({ name: 'John' });
    });
  });

  describe('ip', () => {
    it('returns ip from express', async () => {
      const req = await Request.fromExpress(mockExpressReq());
      expect(req.ip()).toBe('127.0.0.1');
    });

    it('falls back to x-forwarded-for', async () => {
      const req = await Request.fromExpress(mockExpressReq({
        ip: '',
        headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
      }));
      expect(req.ip()).toBe('10.0.0.1');
    });
  });

  describe('fromNode', () => {
    function mockNodeReq(overrides: Record<string, any> = {}): any {
      return {
        method: 'GET',
        url: '/hello?foo=bar',
        headers: { host: 'localhost', accept: 'application/json' },
        on(event: string, cb: Function) {
          if (event === 'data') setTimeout(() => cb(Buffer.from('{"key":"val"}')), 0);
          if (event === 'end') setTimeout(() => cb(), 10);
          if (event === 'error') { /* noop */ }
        },
        ...overrides,
      };
    }

    it('parses a Node request', async () => {
      const req = await Request.fromNode(mockNodeReq());
      expect(req.method).toBe('GET');
      expect(req.path).toBe('/hello');
    });

    it('parses query string', async () => {
      const req = await Request.fromNode(mockNodeReq());
      expect(req.query).toEqual({ foo: 'bar' });
    });

    it('parses JSON body', async () => {
      const req = await Request.fromNode(mockNodeReq());
      expect(req.body).toEqual({ key: 'val' });
    });

    it('rejects body exceeding size limit', async () => {
      Request.setMaxBodyBytes(5);
      const largeBody = 'x'.repeat(100);
      let onError: Function;
      const req = {
        ...mockNodeReq(),
        destroy(err: Error) { onError(err); },
        on(event: string, cb: Function) {
          if (event === 'data') setTimeout(() => cb(Buffer.from(largeBody)), 0);
          if (event === 'end') setTimeout(() => cb(), 10);
          if (event === 'error') onError = cb;
        },
      };
      await expect(Request.fromNode(req)).rejects.toThrow(/too large/i);
      Request.setMaxBodyBytes(10 * 1024 * 1024);
    });
  });
});
