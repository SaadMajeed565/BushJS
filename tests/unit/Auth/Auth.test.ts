import { Auth, SessionGuard, TokenGuard } from '../../../src/Auth/Auth';
import { Request } from '../../../src/Http/Request';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'test-jwt-secret-for-testing-only';

function makeRequest(session?: Record<string, unknown>): Request {
  const req = new Request('GET', '/', {}, {}, {});
  req.session = session;
  return req;
}

describe('Auth', () => {
  let auth: Auth;
  let provider: any;

  beforeEach(() => {
    auth = new Auth();
    provider = {
      findById: jest.fn(),
      validate: jest.fn(),
    };
  });

  describe('register and guard', () => {
    it('registers and retrieves a guard', () => {
      const guard = new SessionGuard();
      auth.register('custom', guard);
      expect(auth.guard('custom')).toBe(guard);
    });

    it('sets provider on guard when registered', () => {
      const guard = new SessionGuard();
      auth.setUserProvider(provider);
      auth.register('custom', guard);
      expect((guard as any).provider).toBe(provider);
    });

    it('throws for unregistered guard', () => {
      expect(() => auth.guard('nonexistent')).toThrow(/not registered/i);
    });
  });

  describe('setUserProvider', () => {
    it('sets provider on all registered guards', () => {
      auth.register('web', new SessionGuard());
      auth.register('api', new TokenGuard());
      auth.setUserProvider(provider);
      expect((auth.guard('web') as any).provider).toBe(provider);
      expect((auth.guard('api') as any).provider).toBe(provider);
    });

    it('returns auth instance for chaining', () => {
      expect(auth.setUserProvider(provider)).toBe(auth);
    });
  });

  describe('check', () => {
    it('delegates to named guard', async () => {
      auth.register('web', new SessionGuard());
      const req = makeRequest({ userId: '1' });
      expect(await auth.check(req, 'web')).toBe(true);
    });

    it('returns false when guard check fails', async () => {
      auth.register('web', new SessionGuard());
      const req = makeRequest({});
      expect(await auth.check(req, 'web')).toBe(false);
    });
  });

  describe('user', () => {
    it('delegates to named guard', async () => {
      const guard = new SessionGuard();
      guard.setProvider(provider);
      auth.register('web', guard);
      provider.findById.mockResolvedValue({ _id: { toString: () => '1' }, name: 'Test' });
      const req = makeRequest({ userId: '1' });
      const result = await auth.user(req, 'web');
      expect(result).toMatchObject({ id: '1', name: 'Test' });
    });
  });

  describe('userFromToken', () => {
    it('returns user from TokenGuard userFromTokenString', async () => {
      const guard = new TokenGuard();
      guard.setProvider(provider);
      auth.register('api', guard);
      provider.findById.mockResolvedValue({ _id: { toString: () => '1' } });
      const token = jwt.sign({ sub: '1' }, JWT_SECRET);
      const result = await auth.userFromToken(token, 'api');
      expect(result).toMatchObject({ id: '1' });
    });

    it('returns null for non-TokenGuard guard', async () => {
      auth.register('web', new SessionGuard());
      const result = await auth.userFromToken('sometoken', 'web');
      expect(result).toBeNull();
    });
  });

  describe('id', () => {
    it('delegates to named guard', () => {
      auth.register('web', new SessionGuard());
      const req = makeRequest({ userId: '42' });
      expect(auth.id(req, 'web')).toBe('42');
    });
  });

  describe('attempt', () => {
    it('validates and logs in on success', async () => {
      const guard = new SessionGuard();
      guard.setProvider(provider);
      auth.register('web', guard);
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: '$2a$10$hash' });
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);
      const req = makeRequest({});
      const result = await auth.attempt(req, { email: 'a@b.com', password: 'secret' }, 'web');
      expect(result).toBe(true);
      expect(req.session!.userId).toBe('1');
    });

    it('returns false on failed validation', async () => {
      const guard = new SessionGuard();
      guard.setProvider(provider);
      auth.register('web', guard);
      provider.validate.mockResolvedValue(null);
      const req = makeRequest({});
      const result = await auth.attempt(req, { email: 'a@b.com', password: 'wrong' }, 'web');
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('delegates to guard login', () => {
      const guard = new SessionGuard();
      auth.register('web', guard);
      const req = makeRequest({});
      auth.login(req, { id: '1' }, 'web');
      expect(req.session!.userId).toBe('1');
    });
  });

  describe('logout', () => {
    it('delegates to guard logout', () => {
      const guard = new SessionGuard();
      auth.register('web', guard);
      const req = makeRequest({ userId: '1' });
      auth.logout(req, 'web');
      expect(req.session!.userId).toBeUndefined();
    });
  });

  describe('hashPassword', () => {
    it('returns a bcrypt hash', async () => {
      const hash = await Auth.hashPassword('secret123');
      expect(hash).toMatch(/^\$2[ab]\$\d+\$/);
      const bcrypt = require('bcryptjs');
      expect(await bcrypt.compare('secret123', hash)).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('generates JWT with user data', () => {
      const token = auth.generateToken({ id: '1', email: 'u@test.com', name: 'User' });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.sub).toBe('1');
      expect(decoded.email).toBe('u@test.com');
      expect(decoded.name).toBe('User');
    });

    it('falls back to _id.toString() when id missing', () => {
      const token = auth.generateToken({ _id: { toString: () => 'mongo-id' } });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.sub).toBe('mongo-id');
    });
  });
});
