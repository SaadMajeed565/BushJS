import { AuthMiddleware, GuestMiddleware } from '../../../src/Http/Middleware/AuthMiddleware';
import { Request } from '../../../src/Http/Request';
import { Response } from '../../../src/Http/Response';
import { auth } from '../../../src/Auth/Auth';

jest.mock('../../../src/Auth/Auth', () => {
  const actual = jest.requireActual('../../../src/Auth/Auth');
  return {
    ...actual,
    auth: {
      check: jest.fn(),
      user: jest.fn(),
    },
  };
});

function makeRequest(session?: Record<string, unknown>): Request {
  const req = new Request('GET', '/', {}, {}, {});
  req.session = session;
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
  };
}

function makeResponse(): Response {
  return new Response(mockExpressRes() as any);
}

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new AuthMiddleware('web');
    req = makeRequest({});
    res = makeResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next when user is authenticated and found', async () => {
    (auth.check as jest.Mock).mockResolvedValue(true);
    (auth.user as jest.Mock).mockResolvedValue({ id: '1', name: 'Test' });
    await middleware.handle(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when check fails', async () => {
    (auth.check as jest.Mock).mockResolvedValue(false);
    const spy = jest.spyOn(res, 'status');
    await middleware.handle(req, res, next);
    expect(spy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when check passes but user is null', async () => {
    (auth.check as jest.Mock).mockResolvedValue(true);
    (auth.user as jest.Mock).mockResolvedValue(null);
    const spy = jest.spyOn(res, 'status');
    await middleware.handle(req, res, next);
    expect(spy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('uses the configured guard name', () => {
    const mw = new AuthMiddleware('api');
    expect((mw as any).guard).toBe('api');
  });
});

describe('GuestMiddleware', () => {
  let middleware: GuestMiddleware;
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new GuestMiddleware();
    req = makeRequest({});
    res = makeResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('allows guest users', async () => {
    (auth.check as jest.Mock).mockResolvedValue(false);
    await middleware.handle(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects authenticated users with 403', async () => {
    (auth.check as jest.Mock).mockResolvedValue(true);
    const spy = jest.spyOn(res, 'status');
    await middleware.handle(req, res, next);
    expect(spy).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
