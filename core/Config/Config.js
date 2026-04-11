"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`) });
class Config {
    constructor() {
        this.configs = new Map();
        this.loadConfigs();
    }
    loadConfigs() {
        this.configs.set('app', this.appConfig());
        this.configs.set('database', this.databaseConfig());
        this.configs.set('auth', this.authConfig());
        this.configs.set('cors', this.corsConfig());
        this.configs.set('rate_limit', this.rateLimitConfig());
        this.configs.set('encryption', this.encryptionConfig());
        this.configs.set('cache', this.cacheConfig());
        this.configs.set('filesystems', this.filesystemsConfig());
    }
    get(key, defaultValue) {
        const keys = key.split('.');
        let value = this.configs.get(keys[0]);
        for (let i = 1; i < keys.length; i++) {
            if (value && typeof value === 'object') {
                value = value[keys[i]];
            }
            else {
                return defaultValue;
            }
        }
        return (value !== undefined ? value : defaultValue);
    }
    set(key, value) {
        const keys = key.split('.');
        const configName = keys[0];
        if (keys.length === 1) {
            this.configs.set(configName, value);
            return;
        }
        const config = this.configs.get(configName) || {};
        let current = config;
        for (let i = 1; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.configs.set(configName, config);
    }
    appConfig() {
        return {
            name: this.env('APP_NAME', 'Bush.js'),
            env: this.env('NODE_ENV', 'development'),
            debug: this.env('APP_DEBUG', 'false') === 'true',
            url: this.env('APP_URL', 'http://localhost:3000'),
            timezone: this.env('APP_TIMEZONE', 'UTC')
        };
    }
    databaseConfig() {
        return {
            driver: this.env('DB_DRIVER', 'mongodb'),
            host: this.env('DB_HOST', 'localhost'),
            port: Number(this.env('DB_PORT', '27017')),
            database: this.env('DB_DATABASE', 'bushjs'),
            username: this.env('DB_USERNAME'),
            password: this.env('DB_PASSWORD'),
            url: this.env('DATABASE_URL')
        };
    }
    authConfig() {
        return {
            defaults: {
                guard: this.env('AUTH_GUARD', 'api'),
                passwords: this.env('AUTH_PASSWORD_BROKER', 'users')
            },
            guards: {
                api: {
                    driver: 'token'
                },
                web: {
                    driver: 'session'
                }
            },
            jwt_secret: this.env('AUTH_JWT_SECRET', 'bush_secret'),
            session_secret: this.env('AUTH_SESSION_SECRET', 'session_secret')
        };
    }
    corsConfig() {
        return {
            allowed_origins: this.env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
                .split(',')
                .map((origin) => origin.trim())
                .filter(Boolean)
        };
    }
    rateLimitConfig() {
        return {
            global_window_ms: Number(this.env('RATE_LIMIT_WINDOW_MS', '900000')),
            global_max: Number(this.env('RATE_LIMIT_MAX', '1000'))
        };
    }
    encryptionConfig() {
        return {
            key: this.env('ENCRYPTION_KEY')
        };
    }
    filesystemsConfig() {
        return {
            default: this.env('FILESYSTEM_DISK', 'local'),
            disks: {
                local: {
                    driver: 'local',
                    root: this.env('STORAGE_PATH', 'storage')
                }
            }
        };
    }
    cacheConfig() {
        return {
            default: this.env('CACHE_DRIVER', 'memory'),
            stores: {
                memory: {
                    driver: 'memory'
                },
                file: {
                    driver: 'file',
                    path: this.env('CACHE_PATH', 'storage/cache')
                },
                redis: {
                    driver: 'redis',
                    host: this.env('REDIS_HOST', 'localhost'),
                    port: Number(this.env('REDIS_PORT', '6379')),
                    password: this.env('REDIS_PASSWORD'),
                    database: Number(this.env('REDIS_DB', '0'))
                }
            }
        };
    }
    get app() {
        return this.get('app');
    }
    get database() {
        return this.get('database');
    }
    get auth() {
        return this.get('auth');
    }
    get cors() {
        return this.get('cors');
    }
    get rate_limit() {
        return this.get('rate_limit');
    }
    get encryption() {
        return this.get('encryption');
    }
    get filesystems() {
        return this.get('filesystems');
    }
    env(key, defaultValue = null) {
        const value = process.env[key];
        if (value === undefined) {
            return defaultValue;
        }
        // Parse boolean strings
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        // Parse null/empty
        if (value === 'null')
            return null;
        if (value === '')
            return '';
        // Parse numbers
        if (!isNaN(Number(value)))
            return Number(value);
        return value;
    }
}
exports.config = new Config();
//# sourceMappingURL=Config.js.map