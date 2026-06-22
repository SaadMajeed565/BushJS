import { SessionGuard } from '../../../src/Auth/Auth';
import { Request } from '../../../src/Http/Request';

function mockUserProvider() {
  return {
    findById: jest.fn(),
    validate: jest.fn(),
  };
}

function makeRequest(session?: Record<string, unknown>): Request {
  const req = new Request('GET', '/', {}, {}, {});
  req.session = session;
  return req;
}

describe('SessionGuard', () => {
  let guard: SessionGuard;
  let provider: ReturnType<typeof mockUserProvider>;

  beforeEach(() => {
    guard = new SessionGuard();
    provider = mockUserProvider();
    guard.setProvider(provider);
  });

  describe('check', () => {
    it('returns true when userId exists in session', async () => {
      const req = makeRequest({ userId: '123' });
      expect(await guard.check(req)).toBe(true);
    });

    it('returns false when session has no userId', async () => {
      const req = makeRequest({});
      expect(await guard.check(req)).toBe(false);
    });

    it('returns false when session is undefined', async () => {
      const req = makeRequest(undefined);
      expect(await guard.check(req)).toBe(false);
    });
  });

  describe('user', () => {
    it('returns cached user from request.user', async () => {
      const cached = { id: '1', name: 'Cached' };
      const req = makeRequest({ userId: '1' });
      (req as any).user = cached;
      const result = await guard.user(req);
      expect(result).toBe(cached);
      expect(provider.findById).not.toHaveBeenCalled();
    });

    it('fetches user from provider when not cached', async () => {
      provider.findById.mockResolvedValue({ _id: { toString: () => '42' }, name: 'John' });
      const req = makeRequest({ userId: '42' });
      const result = await guard.user(req);
      expect(provider.findById).toHaveBeenCalledWith('42');
      expect(result).toMatchObject({ id: '42', name: 'John' });
    });

    it('returns null when no userId in session', async () => {
      const req = makeRequest({});
      expect(await guard.user(req)).toBeNull();
    });

    it('throws when provider is not set', async () => {
      const guard2 = new SessionGuard();
      const req = makeRequest({ userId: '1' });
      await expect(guard2.user(req)).rejects.toThrow(/provider.*not.*registered/i);
    });
  });

  describe('id', () => {
    it('returns userId from session', () => {
      const req = makeRequest({ userId: '99' });
      expect(guard.id(req)).toBe('99');
    });

    it('returns null when no session', () => {
      const req = makeRequest(undefined);
      expect(guard.id(req)).toBeNull();
    });
  });

  describe('validate', () => {
    it('returns user when credentials match', async () => {
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: '$2a$10$hashedpassword' });
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);
      const req = makeRequest();
      const result = await guard.validate({ email: 'a@b.com', password: 'secret' });
      expect(result).toMatchObject({ id: '1' });
    });

    it('returns null when password does not match', async () => {
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: '$2a$10$hashedpassword' });
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false as never);
      const result = await guard.validate({ email: 'a@b.com', password: 'wrong' });
      expect(result).toBeNull();
    });

    it('returns null when no password in credentials', async () => {
      provider.validate.mockResolvedValue({ _id: { toString: () => '1' }, password: 'hash' });
      const result = await guard.validate({ email: 'a@b.com' });
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('sets userId in session and user on request', () => {
      const req = makeRequest({});
      guard.login(req, { id: '1', name: 'John' });
      expect(req.session!.userId).toBe('1');
      expect((req as any).user).toMatchObject({ id: '1', name: 'John' });
    });

    it('throws when request has no session', () => {
      const req = makeRequest(undefined);
      expect(() => guard.login(req, { id: '1' })).toThrow(/session/i);
    });
  });

  describe('logout', () => {
    it('clears userId from session and user from request', () => {
      const req = makeRequest({ userId: '1' });
      (req as any).user = { id: '1' };
      guard.logout(req);
      expect(req.session!.userId).toBeUndefined();
      expect((req as any).user).toBeNull();
    });

    it('handles logout when no session exists', () => {
      const req = makeRequest(undefined);
      expect(() => guard.logout(req)).not.toThrow();
    });
  });
});
