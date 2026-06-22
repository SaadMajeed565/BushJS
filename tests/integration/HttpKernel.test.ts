import request from 'supertest';
import { HttpKernel } from '../../src/Http/Kernel';
import { Application } from '../../src/Foundation/Application';

function createTestApp(): Application {
  return new Application({ basePath: '/tmp/bush-test' });
}

describe('HttpKernel integration', () => {
  let app: Application;
  let kernel: HttpKernel;

  beforeEach(() => {
    app = createTestApp();
    kernel = app.httpKernel;
  });

  it('creates an Express application', () => {
    expect((kernel as any).expressApp).toBeDefined();
  });

  function registerRoutes() {
    (kernel as any).registerRoutes();
  }

  it('responds to registered GET route', async () => {
    app.router.get('/hello', (_req: any, res: any) => {
      res.send('Hello World');
    });
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/hello');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World');
  });

  it('compresses response with gzip', async () => {
    app.router.get('/compress', (_req: any, res: any) => {
      res.send('x'.repeat(2000));
    });
    registerRoutes();
    const res = await request((kernel as any).expressApp)
      .get('/compress')
      .set('Accept-Encoding', 'gzip');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
  });

  it('returns health endpoint with uptime', async () => {
    const res = await request((kernel as any).expressApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('returns 404 for unmatched route', async () => {
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  it('matches route with parameters', async () => {
    app.router.get('/users/:id', async (_req: any, res: any) => {
      res.send(`User ${_req.params.id}`);
    });
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/users/42');
    expect(res.status).toBe(200);
    expect(res.text).toBe('User 42');
  });

  it('handles POST request with JSON body', async () => {
    app.router.post('/data', async (_req: any, res: any) => {
      res.json({ received: (_req as any).body });
    });
    registerRoutes();
    const res = await request((kernel as any).expressApp)
      .post('/data')
      .send({ key: 'value' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: { key: 'value' } });
  });

  it('applies middleware', async () => {
    app.router.get('/protected', (_req: any, res: any) => { res.send('ok'); }, [((_req: any, _res: any, next: () => void) => next()) as any]);
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/protected');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('applies middleware and stops chain when not calling next', async () => {
    const blockingMw = (_req: any, res: any, _next: any) => { res.status(403).json({ error: 'blocked' }); };
    app.router.get('/blocked', (_req: any, res: any) => { res.send('should not reach'); }, [blockingMw as any]);
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/blocked');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'blocked' });
  });

  it('applies middleware via Application.middleware()', async () => {
    app.middleware((_req: any, _res: any, next: () => any) => next());
    app.router.get('/mw-test', async (_req: any, res: any) => { res.send('ok'); });
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/mw-test');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('handles errors with 500 status', async () => {
    app.router.get('/error', async () => {
      throw new Error('Test error');
    });
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/error');
    expect(res.status).toBe(500);
  });

  it('returns JSON response for controller-style action', async () => {
    class TestController {
      index(_req: any, res: any) {
        res.json({ success: true });
      }
    }
    app.router.get('/controller', [TestController, 'index']);
    registerRoutes();
    const res = await request((kernel as any).expressApp).get('/controller');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('matches any() route on any HTTP method', async () => {
    app.router.any('/any-route', async (_req: any, res: any) => {
      res.send('any method works');
    });
    registerRoutes();
    const getRes = await request((kernel as any).expressApp).get('/any-route');
    expect(getRes.status).toBe(200);
    expect(getRes.text).toBe('any method works');
    const postRes = await request((kernel as any).expressApp).post('/any-route');
    expect(postRes.status).toBe(200);
    expect(postRes.text).toBe('any method works');
  });
});
