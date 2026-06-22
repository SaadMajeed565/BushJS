import { CsrfMiddleware } from '../../../src/Http/Middleware/CsrfMiddleware';
import { Request } from '../../../src/Http/Request';
import { Response } from '../../../src/Http/Response';

function makeRequest(overrides: Partial<Request> = {}): Request {
  const req = new Request(
    overrides.method || 'GET',
    overrides.path || '/',
    (overrides.query || {}) as any,
    overrides.body || undefined,
    (overrides.headers || {}) as any,
  );
  if (overrides.session !== undefined) req.session = overrides.session;
  else req.session = {};
  return req;
}

function mockExpressRes(): any {
  return {
    req: {},
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    set: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    get written() { return []; },
  };
}

function makeResponse(): Response {
  return new Response(mockExpressRes() as any);
}

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new CsrfMiddleware();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('safe methods', () => {
    const methods = ['GET', 'HEAD', 'OPTIONS'];

    methods.forEach(method => {
      it(`allows ${method} without token validation`, async () => {
        req = makeRequest({ method, session: {} });
        res = makeResponse();
        await middleware.handle(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('token generation', () => {
    it('generates a token in session when missing', async () => {
      req = makeRequest({ method: 'GET', session: {} });
      res = makeResponse();
      await middleware.handle(req, res, next);
      expect(req.session!['csrf-token']).toBeDefined();
      expect(typeof req.session!['csrf-token']).toBe('string');
    });

    it('does not overwrite existing session token', async () => {
      req = makeRequest({ method: 'GET', session: { 'csrf-token': 'existing-token' } });
      res = makeResponse();
      await middleware.handle(req, res, next);
      expect(req.session!['csrf-token']).toBe('existing-token');
    });

    it('sets X-CSRF-TOKEN header on response', async () => {
      req = makeRequest({ method: 'GET', session: {} });
      res = makeResponse();
      const spy = jest.spyOn(res, 'header');
      await middleware.handle(req, res, next);
      expect(spy).toHaveBeenCalledWith('X-CSRF-TOKEN', expect.any(String));
    });

    it('sets csrf-token cookie on response', async () => {
      req = makeRequest({ method: 'GET', session: {} });
      res = makeResponse();
      const spy = jest.spyOn(res, 'cookie');
      await middleware.handle(req, res, next);
      expect(spy).toHaveBeenCalledWith('csrf-token', expect.any(String), expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
      }));
    });
  });

  describe('unsafe methods', () => {
    const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    methods.forEach(method => {
      it(`validates token for ${method}`, async () => {
        const token = 'valid-csrf-token-1234567890';
        req = makeRequest({ method, session: { 'csrf-token': token }, headers: { 'x-csrf-token': token } });
        res = makeResponse();
        await middleware.handle(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });

    it('rejects when header token does not match session token', async () => {
      req = makeRequest({
        method: 'POST',
        session: { 'csrf-token': 'real-token' },
        headers: { 'x-csrf-token': 'wrong-token' },
      });
      res = makeResponse();
      const spy = jest.spyOn(res, 'status');
      await middleware.handle(req, res, next);
      expect(spy).toHaveBeenCalledWith(419);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects when no token is provided', async () => {
      req = makeRequest({ method: 'POST', session: { 'csrf-token': 'real-token' } });
      res = makeResponse();
      const spy = jest.spyOn(res, 'status');
      await middleware.handle(req, res, next);
      expect(spy).toHaveBeenCalledWith(419);
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts token from request body _token field', async () => {
      const token = 'body-token-1234567890';
      req = makeRequest({
        method: 'POST',
        session: { 'csrf-token': token },
        body: { _token: token },
      });
      res = makeResponse();
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('accepts token from request body csrf_token field', async () => {
      const token = 'body-csrf-token-1234567890';
      req = makeRequest({
        method: 'POST',
        session: { 'csrf-token': token },
        body: { csrf_token: token },
      });
      res = makeResponse();
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('no session', () => {
    it('creates no token when session is undefined', async () => {
      req = makeRequest({ method: 'GET', session: undefined as any });
      res = makeResponse();
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
