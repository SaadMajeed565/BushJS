import { Gate } from '../../src/Auth/Gate';

class PostModel {
  id = 1;
  userId = 999;
}

class OtherModel {}

describe('Gate', () => {
  let gate: Gate;

  const adminUser = { role: 'admin', id: 1 };
  const regularUser = { role: 'user', id: 999 };
  const postModel = new PostModel();

  beforeEach(() => {
    gate = new Gate();

    gate.define('PostModel', {
      viewAny(user: any) {
        return true;
      },
      view(user: any, post: any) {
        return user.role === 'admin' || post.userId === user.id;
      },
      create(user: any) {
        return user.role === 'admin';
      },
      update(user: any, post: any) {
        return user.role === 'admin' || post.userId === user.id;
      },
      delete(user: any, post: any) {
        return user.role === 'admin';
      },
    });
  });

  describe('allows', () => {
    it('returns true when policy allows', async () => {
      expect(await gate.allows(adminUser, 'viewAny', new PostModel())).toBe(true);
    });

    it('returns false when policy denies', async () => {
      expect(await gate.allows(regularUser, 'delete', postModel)).toBe(false);
    });

    it('returns false for undefined policies', async () => {
      expect(await gate.allows(adminUser, 'view', new OtherModel())).toBe(false);
    });

    it('calls viewAny/create with (user) only', async () => {
      const spy = jest.fn(() => true);
      gate.define('TestModel', { viewAny: spy });
      await gate.allows(adminUser, 'viewAny', new (class TestModel {})());
      expect(spy).toHaveBeenCalledWith(adminUser);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls view/update/delete with (user, model)', async () => {
      const spy = jest.fn(() => true);
      gate.define('TestModel', { update: spy });
      const model = new (class TestModel {})();
      await gate.allows(adminUser, 'update', model);
      expect(spy).toHaveBeenCalledWith(adminUser, model);
    });
  });

  describe('denies', () => {
    it('inverts allows', async () => {
      expect(await gate.denies(adminUser, 'delete', new PostModel())).toBe(false);
      expect(await gate.denies(regularUser, 'delete', new PostModel())).toBe(true);
    });
  });

  describe('authorize', () => {
    it('does not throw when allowed', async () => {
      await expect(gate.authorize(adminUser, 'create', new PostModel())).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when denied', async () => {
      await expect(gate.authorize(regularUser, 'create', new PostModel())).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('policy resolution', () => {
    it('resolves policy by constructor name when passed a model object', async () => {
      const result = await gate.allows(regularUser, 'view', new PostModel());
      expect(result).toBe(true);
    });
  });
});
