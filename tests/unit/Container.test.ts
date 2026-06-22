import { Container } from '../../src/Container/Container';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('bind', () => {
    it('stores a factory and returns a new instance each time', () => {
      container.bind('service', () => ({ count: Math.random() }));
      const a = container.make<{ count: number }>('service');
      const b = container.make<{ count: number }>('service');
      expect(a).not.toBe(b);
    });

    it('stores a concrete value', () => {
      container.bind('config', { host: 'localhost' });
      expect(container.make('config')).toEqual({ host: 'localhost' });
    });
  });

  describe('singleton', () => {
    it('returns the same instance on every make', () => {
      container.singleton('db', () => ({ connected: true }));
      const a = container.make('db');
      const b = container.make('db');
      expect(a).toBe(b);
    });

    it('persists a literal value as singleton', () => {
      container.singleton('pi', 3.14);
      expect(container.make<number>('pi')).toBe(3.14);
    });
  });

  describe('instance', () => {
    it('stores a pre-built instance directly', () => {
      const obj = { cached: true };
      container.instance('cache', obj);
      expect(container.make('cache')).toBe(obj);
    });

    it('takes priority over bindings', () => {
      container.bind('x', () => 'from bind');
      container.instance('x', 'from instance');
      expect(container.make('x')).toBe('from instance');
    });
  });

  describe('make', () => {
    it('throws for unregistered keys', () => {
      expect(() => container.make('nothing')).toThrow(/not found/i);
    });

    it('passes the container to factory functions', () => {
      container.singleton('inner', () => 42);
      container.bind('outer', (c) => c.make<number>('inner'));
      expect(container.make('outer')).toBe(42);
    });
  });

  describe('has', () => {
    it('returns true for registered keys', () => {
      container.bind('a', 1);
      expect(container.has('a')).toBe(true);
    });

    it('returns false for unregistered keys', () => {
      expect(container.has('missing')).toBe(false);
    });
  });

  describe('forget', () => {
    it('removes a key', () => {
      container.bind('temp', 'value');
      container.forget('temp');
      expect(container.has('temp')).toBe(false);
    });

    it('also forgets singleton instances', () => {
      container.singleton('s', () => ({}));
      container.make('s'); // cache the instance
      container.forget('s');
      expect(container.has('s')).toBe(false);
    });
  });

  describe('flush', () => {
    it('clears all bindings and instances', () => {
      container.bind('a', 1);
      container.singleton('b', () => 2);
      container.instance('c', 3);
      container.flush();
      expect(container.has('a')).toBe(false);
      expect(container.has('b')).toBe(false);
      expect(container.has('c')).toBe(false);
    });
  });
});
