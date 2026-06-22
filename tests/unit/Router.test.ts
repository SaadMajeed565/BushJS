import { Router } from '../../src/Http/Router';

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe('basic HTTP method registration', () => {
    it('registers a GET route', () => {
      router.get('/users', () => {});
      const routes = router.getRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0].method).toBe('GET');
      expect(routes[0].path).toBe('/users');
    });

    it('registers a POST route', () => {
      router.post('/users', () => {});
      expect(router.getRoutes()).toHaveLength(1);
      expect(router.getRoutes()[0].method).toBe('POST');
    });

    it('registers PUT, PATCH, DELETE routes', () => {
      router.put('/users/1', () => {});
      router.patch('/users/1', () => {});
      router.delete('/users/1', () => {});
      expect(router.getRoutes()).toHaveLength(3);
    });

    it('registers ANY route', () => {
      router.any('/webhook', () => {});
      expect(router.getRoutes()).toHaveLength(1);
      expect(router.getRoutes()[0].method).toBe('ANY');
    });
  });

  describe('match', () => {
    it('matches a registered route by method and path', () => {
      const action = () => {};
      router.get('/hello', action);
      const result = router.match('GET', '/hello');
      expect(result).not.toBeNull();
      expect(result!.route.action).toBe(action);
    });

    it('returns null for unmatched routes', () => {
      router.get('/hello', () => {});
      expect(router.match('GET', '/world')).toBeNull();
    });

    it('extracts named parameters', () => {
      router.get('/users/:id', () => {});
      const result = router.match('GET', '/users/42');
      expect(result!.params).toEqual({ id: '42' });
    });

    it('matches ANY routes with any method', () => {
      router.any('/webhook', () => {});
      expect(router.match('GET', '/webhook')).not.toBeNull();
      expect(router.match('POST', '/webhook')).not.toBeNull();
    });
  });

  describe('groups', () => {
    it('applies prefix to routes inside group', () => {
      router.group({ prefix: '/api' }, () => {
        router.get('/users', () => {});
      });
      expect(router.getRoutes()[0].path).toBe('/api/users');
    });

    it('stacks nested group prefixes', () => {
      router.group({ prefix: '/api' }, () => {
        router.group({ prefix: '/v1' }, () => {
          router.get('/users', () => {});
        });
      });
      expect(router.getRoutes()[0].path).toBe('/api/v1/users');
    });

    it('applies middleware from groups to routes', () => {
      const mw = () => {};
      router.group({ prefix: '/admin', middleware: [mw] }, () => {
        router.get('/dashboard', () => {});
      });
      expect(router.getRoutes()[0].middleware).toContain(mw);
    });
  });

  describe('resource routes', () => {
    it('registers 7 RESTful routes', () => {
      const controller = { index: () => {} };
      router.resource('/photos', controller);
      const routes = router.getRoutes();
      expect(routes).toHaveLength(7);
      const methods = routes.map(r => `${r.method} ${r.path}`);
      expect(methods).toContain('GET /photos');
      expect(methods).toContain('GET /photos/create');
      expect(methods).toContain('POST /photos');
      expect(methods).toContain('GET /photos/:id');
      expect(methods).toContain('GET /photos/:id/edit');
      expect(methods).toContain('PUT /photos/:id');
      expect(methods).toContain('DELETE /photos/:id');
    });

    it('respects only option', () => {
      router.resource('/posts', {}, { only: ['index', 'show'] });
      expect(router.getRoutes()).toHaveLength(2);
    });

    it('respects except option', () => {
      router.resource('/posts', {}, { except: ['create', 'edit'] });
      expect(router.getRoutes()).toHaveLength(5);
    });
  });

  describe('apiResource routes', () => {
    it('registers 5 RESTful routes (no create/edit)', () => {
      router.apiResource('/posts', {});
      const routes = router.getRoutes();
      expect(routes).toHaveLength(5);
      const paths = routes.map(r => r.path);
      expect(paths).not.toContain('/posts/create');
      expect(paths).not.toContain('/posts/:id/edit');
    });
  });

  describe('named routes', () => {
    it('assigns name to last registered route', () => {
      router.get('/users', () => {});
      router.name('users.index');
      expect(router.url('users.index')).toBe('/users');
    });

    it('generates URL with parameters', () => {
      router.get('/users/:id', () => {});
      router.name('users.show');
      expect(router.url('users.show', { id: '5' })).toBe('/users/5');
    });

    it('throws for unknown named routes', () => {
      expect(() => router.url('nope')).toThrow(/not found/i);
    });
  });

  describe('middleware groups', () => {
    it('resolves string middleware names to groups', () => {
      const mw = () => {};
      router.middlewareGroup('auth', [mw]);
      router.get('/admin', () => {}, ['auth']);
      expect(router.getRoutes()[0].middleware).toContain(mw);
    });
  });
});
