import { APIVersioning } from '../../src/Http/APIVersioning';

function mockRes(): any {
  return { setHeader: jest.fn() };
}

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    get: (name: string) => {
      const header = Object.keys(overrides.headers ?? {}).find(
        k => k.toLowerCase() === name.toLowerCase(),
      );
      return header ? overrides.headers[header] : undefined;
    },
    query: overrides.query || {},
    path: overrides.path || '/api/v1/users',
    ...overrides,
  };
}

describe('APIVersioning', () => {
  let versioning: APIVersioning;

  beforeEach(() => {
    versioning = new APIVersioning({
      defaultVersion: '1',
      supportedVersions: ['1', '2'],
      headerName: 'Accept-Version',
      queryParam: 'v',
      urlPrefix: '/api',
    });
  });

  describe('middleware', () => {
    it('attaches version to request and response', () => {
      const req = mockReq({ headers: { 'accept-version': '2' } });
      const res = mockRes();
      const next = jest.fn();
      versioning.middleware()(req, res, next);
      expect((req as any).apiVersion).toBe('2');
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', '2');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('route', () => {
    it('prepends version prefix', () => {
      expect(versioning.route('/users')).toBe('/api/v1/users');
      expect(versioning.route('/users', '2')).toBe('/api/v2/users');
    });
  });

  describe('versionRouter', () => {
    it('returns a router for valid version', () => {
      const router = versioning.versionRouter('1');
      expect(router).toBeDefined();
    });

    it('throws for unsupported version', () => {
      expect(() => versioning.versionRouter('3')).toThrow(/unsupported/i);
    });
  });

  describe('getSupportedVersions', () => {
    it('returns all supported versions', () => {
      expect(versioning.getSupportedVersions()).toEqual(['1', '2']);
    });
  });

  describe('static getVersion', () => {
    it('returns version from request', () => {
      const req = mockReq();
      (req as any).apiVersion = '2';
      expect(APIVersioning.getVersion(req)).toBe('2');
    });

    it('returns default "1" when not set', () => {
      expect(APIVersioning.getVersion(mockReq())).toBe('1');
    });
  });

  describe('static versionedResponse', () => {
    it('adds version field and version-specific fields', () => {
      const req = mockReq();
      (req as any).apiVersion = '2';
      const result = APIVersioning.versionedResponse(req, { name: 'test' }, { '2': { newField: true } });
      expect(result._apiVersion).toBe('2');
      expect(result.newField).toBe(true);
    });
  });

  describe('version extraction order', () => {
    it('header takes priority over query and URL', () => {
      const req = mockReq({
        headers: { 'accept-version': '2' },
        query: { v: '1' },
        path: '/api/v1/users',
      });
      const res = mockRes();
      versioning.middleware()(req, res, jest.fn());
      expect((req as any).apiVersion).toBe('2');
    });

    it('falls back to default when no version is provided', () => {
      const req = mockReq({ headers: {}, query: {}, path: '/users' });
      const res = mockRes();
      versioning.middleware()(req, res, jest.fn());
      expect((req as any).apiVersion).toBe('1');
    });
  });

  describe('deprecateVersion', () => {
    it('adds deprecation headers for deprecated version', () => {
      const deprecate = require('../../src/Http/APIVersioning').deprecateVersion('1', 'v1 is deprecated');
      const req = mockReq();
      (req as any).apiVersion = '1';
      const res = mockRes();
      deprecate(req, res, jest.fn());
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Deprecated', 'true');
    });

    it('does not add deprecation headers for non-deprecated version', () => {
      const deprecate = require('../../src/Http/APIVersioning').deprecateVersion('1', 'v1 is deprecated');
      const req = mockReq();
      (req as any).apiVersion = '2';
      const res = mockRes();
      deprecate(req, res, jest.fn());
      expect(res.setHeader).not.toHaveBeenCalledWith('X-API-Deprecated', 'true');
    });
  });
});
