"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiVersioning = exports.APIVersioning = void 0;
exports.v1Route = v1Route;
exports.v2Route = v2Route;
exports.requireVersion = requireVersion;
exports.deprecateVersion = deprecateVersion;
const express_1 = __importDefault(require("express"));
class APIVersioning {
    constructor(config) {
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
        return (req, res, next) => {
            const version = this.extractVersion(req);
            // Attach version to request object
            req.apiVersion = version;
            // Add version to response headers
            res.setHeader('X-API-Version', version);
            next();
        };
    }
    /**
     * Extract version from request
     */
    extractVersion(req) {
        // 1. Check header
        if (this.config.headerName) {
            const headerVersion = req.get(this.config.headerName);
            if (headerVersion && this.isValidVersion(headerVersion)) {
                return headerVersion;
            }
        }
        // 2. Check query parameter
        if (this.config.queryParam) {
            const queryVersion = req.query[this.config.queryParam];
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
    isValidVersion(version) {
        return this.config.supportedVersions.includes(version);
    }
    /**
     * Get versioned route path
     */
    route(path, version) {
        const v = version || this.config.defaultVersion;
        return `${this.config.urlPrefix}/v${v}${path}`;
    }
    /**
     * Create version-specific router
     */
    versionRouter(version) {
        const router = express_1.default.Router();
        // Validate version
        if (!this.isValidVersion(version)) {
            throw new Error(`Unsupported API version: ${version}`);
        }
        return router;
    }
    /**
     * Get all supported versions
     */
    getSupportedVersions() {
        return [...this.config.supportedVersions];
    }
    /**
     * Get current version from request
     */
    static getVersion(req) {
        return req.apiVersion || '1';
    }
    /**
     * Version-aware response helper
     */
    static versionedResponse(req, data, versionSpecificFields = {}) {
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
exports.APIVersioning = APIVersioning;
// Default API versioning instance
exports.apiVersioning = new APIVersioning({
    defaultVersion: '1',
    supportedVersions: ['1', '2'],
    headerName: 'Accept-Version',
    queryParam: 'v',
    urlPrefix: '/api'
});
// Version-specific route helpers
function v1Route(path) {
    return exports.apiVersioning.route(path, '1');
}
function v2Route(path) {
    return exports.apiVersioning.route(path, '2');
}
// Version checking middleware
function requireVersion(version) {
    return (req, res, next) => {
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
function deprecateVersion(version, deprecationMessage) {
    return (req, res, next) => {
        const requestVersion = APIVersioning.getVersion(req);
        if (requestVersion === version) {
            res.setHeader('X-API-Deprecated', 'true');
            res.setHeader('X-API-Deprecation-Message', deprecationMessage || `API version ${version} is deprecated. Please upgrade to a newer version.`);
        }
        next();
    };
}
//# sourceMappingURL=APIVersioning.js.map