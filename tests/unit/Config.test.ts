import { config } from '../../src/Config/Config';

describe('Config', () => {
  describe('get/set', () => {
    it('returns value by dot-notation key', () => {
      const val = config.get('app.name');
      expect(typeof val).toBe('string');
    });

    it('returns default for missing keys', () => {
      expect(config.get('nonexistent.key', 'fallback')).toBe('fallback');
    });

    it('returns undefined when no default and key missing', () => {
      expect(config.get('nothing.here')).toBeUndefined();
    });

    it('set stores a top-level config', () => {
      config.set('custom', { foo: 'bar' });
      expect(config.get('custom.foo')).toBe('bar');
    });

    it('set stores a nested value', () => {
      config.set('nested.a.b', 42);
      expect(config.get('nested.a.b')).toBe(42);
    });
  });

  describe('getter properties', () => {
    it('app returns AppConfig', () => {
      const cfg = config.app;
      expect(cfg).toHaveProperty('name');
      expect(cfg).toHaveProperty('env');
    });

    it('auth returns AuthConfig', () => {
      const cfg = config.auth;
      expect(cfg).toHaveProperty('jwt_secret');
      expect(cfg).toHaveProperty('session_secret');
    });
  });

  describe('env parsing', () => {
    it('parses boolean strings', () => {
      process.env.TEST_BOOL_TRUE = 'true';
      process.env.TEST_BOOL_FALSE = 'false';
      const c = new (config.constructor as any)();
      expect(c.env('TEST_BOOL_TRUE')).toBe(true);
      expect(c.env('TEST_BOOL_FALSE')).toBe(false);
    });

    it('parses numeric env keys', () => {
      process.env.DB_PORT = '27017';
      const c = new (config.constructor as any)();
      expect(c.env('DB_PORT')).toBe(27017);
    });

    it('returns default when env is not set', () => {
      const c = new (config.constructor as any)();
      expect(c.env('UNSET_VAR', 'default')).toBe('default');
    });
  });
});
