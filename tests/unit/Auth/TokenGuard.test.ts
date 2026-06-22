import { TokenGuard } from '../../../src/Auth/Auth';
import { Request } from '../../../src/Http/Request';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'test-jwt-secret-for-testing-only';

function mockUserProvider() {
  return {
    findById: jest.fn(),
    validate: jest.fn(),
  };
}

function makeRequest(headers: Record<string, string | string[]> = {}): Request {
  return new Request('GET', '/', {}, {}, headers);
}

function validToken(payload: Record<string, any> = {}): string {
  return jwt.sign({ sub: 'user-1', ...payload }, JWT_SECRET);
}

describe('TokenGuard', () => {
  let guard: TokenGuard;
  let provider: ReturnType<typeof mockUserProvider>;

  beforeEach(() => {
    guard = new TokenGuard();
    provider = mockUserProvider();
    guard.setProvider(provider);
  });

  describe('check', () => {
    it('returns true for a valid Bearer token', async () => {
      const req = makeRequest({ authorization: `Bearer ${validToken()}` });
      expect(await guard.check(req)).toBe(true);
    });

    it('returns false when no Authorization header', async () => {
      const req = makeRequest({});
      expect(await guard.check(req)).toBe(false);
    });

    it('returns false for invalid token', async () => {
      const req = makeRequest({ authorization: 'Bearer invalidtoken' });
      expect(await guard.check(req)).toBe(false);
    });

    it('returns false for malformed auth header', async () => {
      const req = makeRequest({ authorization: 'Basic abc123' });
      expect(await guard.check(req)).toBe(false);
    });

    it('handles array authorization header', async () => {
      const req = makeRequest({ authorization: [`Bearer ${validToken()}`, 'other'] });
      expect(await guard.check(req)).toBe(true);
    });
  });

  describe('user', () => {
    it('returns cached user from request.user', async () => {
      const cached = { id: '1', name: 'Cached' };
      const req = makeRequest({ authorization: `Bearer ${validToken()}` });
      (req as any).user = cached;
      const result = await guard.user(req);
      expect(result).toBe(cached);
      expect(provider.findById).not.toHaveBeenCalled();
    });

    it('fetches user from provider by token sub', async () => {
      provider.findById.mockResolvedValue({ _id: { toString: () => 'user-1' }, name: 'John' });
      const req = makeRequest({ authorization: `Bearer ${validToken()}` });
      const result = await guard.user(req);
      expect(provider.findById).toHaveBeenCalledWith('user-1');
      expect(result).toMatchObject({ id: 'user-1', name: 'John' });
    });

    it('returns null when no token', async () => {
      const req = makeRequest({});
      expect(await guard.user(req)).toBeNull();
    });
  });

  describe('id', () => {
    it('returns existing userId from request', () => {
      const req = makeRequest();
      req.userId = 'direct-id';
      expect(guard.id(req)).toBe('direct-id');
    });

    it('extracts sub from token', () => {
      const req = makeRequest({ authorization: `Bearer ${validToken()}` });
      expect(guard.id(req)).toBe('user-1');
    });

    it('returns null when no token and no userId', () => {
      const req = makeRequest({});
      expect(guard.id(req)).toBeNull();
    });
  });

  describe('validate', () => {
    it('returns user when credentials match', async () => {
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: '$2a$10$hashed' });
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);
      const result = await guard.validate({ email: 'a@b.com', password: 'secret' });
      expect(result).toMatchObject({ id: '1' });
    });

    it('returns null on wrong password', async () => {
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: '$2a$10$hashed' });
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false as never);
      const result = await guard.validate({ email: 'a@b.com', password: 'wrong' });
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('sets user and generates JWT token on request', () => {
      const req = makeRequest();
      guard.login(req, { id: '1', name: 'Jane', email: 'jane@test.com' });
      expect(req.token).toBeDefined();
      expect(typeof req.token).toBe('string');
      expect((req as any).user).toMatchObject({ id: '1', name: 'Jane' });
      const decoded = jwt.verify(req.token!, JWT_SECRET) as any;
      expect(decoded.sub).toBe('1');
      expect(decoded.email).toBe('jane@test.com');
    });
  });

  describe('logout', () => {
    it('clears user and token', () => {
      const req = makeRequest();
      req.token = 'some-token';
      (req as any).user = { id: '1' };
      guard.logout(req);
      expect((req as any).user).toBeNull();
      expect(req.token).toBeUndefined();
    });
  });

  describe('userFromTokenString', () => {
    it('returns user for valid token string', async () => {
      provider.findById.mockResolvedValue({ _id: { toString: () => 'user-1' }, name: 'FromToken' });
      const result = await guard.userFromTokenString(validToken());
      expect(result).toMatchObject({ id: 'user-1', name: 'FromToken' });
    });

    it('strips Bearer prefix', async () => {
      provider.findById.mockResolvedValue({ _id: { toString: () => 'user-1' } });
      const result = await guard.userFromTokenString(`Bearer ${validToken()}`);
      expect(result).not.toBeNull();
    });

    it('returns null for null/empty token', async () => {
      expect(await guard.userFromTokenString(null)).toBeNull();
      expect(await guard.userFromTokenString('')).toBeNull();
      expect(await guard.userFromTokenString('   ')).toBeNull();
    });

    it('returns null for invalid token', async () => {
      expect(await guard.userFromTokenString('bad-token')).toBeNull();
    });

    it('returns null when payload has no sub', async () => {
      const tokenNoSub = jwt.sign({ foo: 'bar' }, JWT_SECRET);
      expect(await guard.userFromTokenString(tokenNoSub)).toBeNull();
    });
  });
});
