import request from 'supertest';
import { Application } from '../../src/Foundation/Application';
import express from 'express';

describe('Application bootstrap', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({ basePath: '/tmp/bush-test' });
  });

  it('creates an Application instance', () => {
    expect(app).toBeInstanceOf(Application);
  });

  it('has a container', () => {
    expect(app.container).toBeDefined();
  });

  it('has a router', () => {
    expect(app.router).toBeDefined();
  });

  it('has an HttpKernel', () => {
    expect(app.httpKernel).toBeDefined();
  });

  it('has a ConsoleKernel', () => {
    expect(app.consoleKernel).toBeDefined();
  });

  it('has a database connection', () => {
    expect(app.database).toBeDefined();
  });

  it('exposes expressApp', () => {
    expect(app.expressApp).toBeDefined();
  });

  it('registers and responds via app.get()', async () => {
    app.get('/app-route', async (_req: any, res: any) => {
      res.send('App OK');
    });
    (app.httpKernel as any).registerRoutes();
    const res = await request(app.expressApp).get('/app-route');
    expect(res.status).toBe(200);
    expect(res.text).toBe('App OK');
  });

  it('registers and responds via app.route()', async () => {
    app.route('POST', '/app-route', async (_req: any, res: any) => {
      res.json({ status: 'created' });
    });
    (app.httpKernel as any).registerRoutes();
    const res = await request(app.expressApp).post('/app-route');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'created' });
  });

  it('supports route groups', () => {
    let called = false;
    app.group({ prefix: '/admin' }, () => {
      app.get('/dashboard', async () => { called = true; });
    });
    const routes = app.router.getRoutes();
    expect(routes[0].path).toBe('/admin/dashboard');
  });

  it('registers container singletons', () => {
    expect(app.container.make('app')).toBe(app);
    expect(app.container.make('router')).toBe(app.router);
    expect(app.container.make('http.kernel')).toBe(app.httpKernel);
    expect(app.container.make('console.kernel')).toBe(app.consoleKernel);
    expect(app.container.make('database')).toBe(app.database);
  });

  it('returns base path for subdirectories', () => {
    const p = app.basePathTo('storage');
    expect(p).toMatch(/\/tmp\/bush-test\/storage$/);
  });

  it('handles error routes with JSON', async () => {
    app.get('/error', async (_req: any, _res: any) => { throw new Error('Boom'); });
    (app.httpKernel as any).registerRoutes();
    const res = await request(app.expressApp).get('/error').set('Accept', 'application/json');
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ status: 500 });
  });
});
