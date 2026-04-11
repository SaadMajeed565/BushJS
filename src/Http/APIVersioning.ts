import express from 'express';

export interface VersionConfig {
  defaultVersion: string;
  supportedVersions: string[];
  headerName?: string;
  queryParam?: string;
  urlPrefix?: string;
}

export class APIVersioning {
  private config: VersionConfig;

  constructor(config: VersionConfig) {
    this.config = {
      headerName: 'Accept-Version',
      queryParam: 'v',
      urlPrefix: '/api',
      ...config
    };
  }

  /**
   * Middleware to extract API version from request
   */
  middleware() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const version = this.extractVersion(req);

      // Attach version to request object
      (req as any).apiVersion = version;

      // Add version to response headers
      res.setHeader('X-API-Version', version);

      next();
    };
  }

  /**
   * Extract version from request
   */
  private extractVersion(req: express.Request): string {
    // 1. Check header
    if (this.config.headerName) {
      const headerVersion = req.get(this.config.headerName);
      if (headerVersion && this.isValidVersion(headerVersion)) {
        return headerVersion;
      }
    }

    // 2. Check query parameter
    if (this.config.queryParam) {
      const queryVersion = req.query[this.config.queryParam] as string;
      if (queryVersion && this.isValidVersion(queryVersion)) {
        return queryVersion;
      }
    }

    // 3. Check URL path
    if (this.config.urlPrefix) {
      const urlMatch = req.path.match(new RegExp(`^${this.config.urlPrefix}/v(\\d+)(/|$)`));
      if (urlMatch && this.isValidVersion(urlMatch[1])) {
        return urlMatch[1];
      }
    }

    // 4. Return default version
    return this.config.defaultVersion;
  }

  /**
   * Check if version is supported
   */
  private isValidVersion(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Get versioned route path
   */
  route(path: string, version?: string): string {
    const v = version || this.config.defaultVersion;
    return `${this.config.urlPrefix}/v${v}${path}`;
  }

  /**
   * Create version-specific router
   */
  versionRouter(version: string): express.Router {
    const router = express.Router();

    // Validate version
    if (!this.isValidVersion(version)) {
      throw new Error(`Unsupported API version: ${version}`);
    }

    return router;
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions(): string[] {
    return [...this.config.supportedVersions];
  }

  /**
   * Get current version from request
   */
  static getVersion(req: express.Request): string {
    return (req as any).apiVersion || '1';
  }

  /**
   * Version-aware response helper
   */
  static versionedResponse(req: express.Request, data: any, versionSpecificFields: { [version: string]: any } = {}): any {
    const version = this.getVersion(req);
    const response = { ...data };

    // Add version-specific fields
    if (versionSpecificFields[version]) {
      Object.assign(response, versionSpecificFields[version]);
    }

    // Add version metadata
    response._apiVersion = version;

    return response;
  }
}

// Default API versioning instance
export const apiVersioning = new APIVersioning({
  defaultVersion: '1',
  supportedVersions: ['1', '2'],
  headerName: 'Accept-Version',
  queryParam: 'v',
  urlPrefix: '/api'
});

// Version-specific route helpers
export function v1Route(path: string): string {
  return apiVersioning.route(path, '1');
}

export function v2Route(path: string): string {
  return apiVersioning.route(path, '2');
}

// Version checking middleware
export function requireVersion(version: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestVersion = APIVersioning.getVersion(req);

    if (requestVersion !== version) {
      return res.status(400).json({
        error: 'Version mismatch',
        message: `This endpoint requires API version ${version}, but received ${requestVersion}`,
        requiredVersion: version,
        receivedVersion: requestVersion
      });
    }

    next();
  };
}

// Deprecation middleware for old versions
export function deprecateVersion(version: string, deprecationMessage?: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestVersion = APIVersioning.getVersion(req);

    if (requestVersion === version) {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Message',
        deprecationMessage || `API version ${version} is deprecated. Please upgrade to a newer version.`);
    }

    next();
  };
}