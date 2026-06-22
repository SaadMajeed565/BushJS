import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`) });
dotenv.config();

export interface AppConfig {
  name: string;
  env: string;
  debug: boolean;
  url: string;
  timezone: string;
}

export interface DatabaseConfig {
  driver: string;
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  url?: string;
  pool?: {
    max: number;
    min: number;
  };
}

export interface AuthConfig {
  defaults: {
    guard: string;
    passwords: string;
  };
  guards: {
    [key: string]: {
      driver: string;
    };
  };
  jwt_secret: string;
  session_secret: string;
}

export interface CorsConfig {
  allowed_origins?: string[];
}

export interface RateLimitConfig {
  global_window_ms?: number;
  global_max?: number;
}

export interface EncryptionConfig {
  key?: string;
}

export interface CacheConfig {
  default: string;
  stores: {
    [key: string]: {
      driver: string;
      [key: string]: any;
    };
  };
}

export interface FilesystemsConfig {
  default: string;
  disks: {
    local: {
      driver: string;
      root: string;
    };
  };
}

export interface StructureConfig {
  controllers: string;
  middleware: string;
  requests: string;
  models: string;
  policies: string;
  routes: string;
  commands: string;
  schemas: string;
  seeders: string;
}

class Config {
  private configs: Map<string, any> = new Map();

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs(): void {
    this.configs.set('app', this.appConfig());
    this.configs.set('database', this.databaseConfig());
    this.configs.set('auth', this.authConfig());
    this.configs.set('cors', this.corsConfig());
    this.configs.set('rate_limit', this.rateLimitConfig());
    this.configs.set('encryption', this.encryptionConfig());
    this.configs.set('cache', this.cacheConfig());
    this.configs.set('filesystems', this.filesystemsConfig());
    this.configs.set('structure', this.structureConfig());
  }

  get<T>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.configs.get(keys[0]);

    for (let i = 1; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        return defaultValue as T;
      }
    }

    return (value !== undefined ? value : defaultValue) as T;
  }

  set(key: string, value: any): void {
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

  private appConfig(): AppConfig {
    return {
      name: this.env('APP_NAME', 'Bush.js'),
      env: this.env('NODE_ENV', 'development'),
      debug: this.env('APP_DEBUG', 'false') === 'true',
      url: this.env('APP_URL', 'http://localhost:3000'),
      timezone: this.env('APP_TIMEZONE', 'UTC')
    };
  }

  private databaseConfig(): DatabaseConfig {
    return {
      driver: this.env('DB_DRIVER', 'mongodb'),
      host: this.env('DB_HOST', 'localhost'),
      port: Number(this.env('DB_PORT', '27017')),
      database: this.env('DB_DATABASE', 'bushjs'),
      username: this.env('DB_USERNAME'),
      password: this.env('DB_PASSWORD'),
      url: this.env('DATABASE_URL'),
      pool: {
        max: this.env('DB_POOL_MAX', 10),
        min: this.env('DB_POOL_MIN', 2),
      }
    };
  }

  private authConfig(): AuthConfig {
    const jwtSecret = this.env('AUTH_JWT_SECRET');
    const sessionSecret = this.env('AUTH_SESSION_SECRET');
    const isProduction = this.env('NODE_ENV', 'development') === 'production';

    if (isProduction && (!jwtSecret || !sessionSecret)) {
      throw new Error(
        'AUTH_JWT_SECRET and AUTH_SESSION_SECRET are required in production.'
      );
    }

    if (!jwtSecret || !sessionSecret) {
      throw new Error(
        'AUTH_JWT_SECRET and AUTH_SESSION_SECRET must be set in .env'
      );
    }

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
      jwt_secret: jwtSecret,
      session_secret: sessionSecret
    };
  }

  private corsConfig(): CorsConfig {
    return {
      allowed_origins: (this.env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000') as string)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    };
  }

  private rateLimitConfig(): RateLimitConfig {
    return {
      global_window_ms: Number(this.env('RATE_LIMIT_WINDOW_MS', '900000')),
      global_max: Number(this.env('RATE_LIMIT_MAX', '1000'))
    };
  }

  private encryptionConfig(): EncryptionConfig {
    return {
      key: this.env('ENCRYPTION_KEY')
    };
  }

  private filesystemsConfig(): FilesystemsConfig {
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

  private cacheConfig(): CacheConfig {
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

  private structureConfig(): StructureConfig {
    return {
      controllers: this.env('STRUCTURE_CONTROLLERS_DIR', 'app/Http/Controllers'),
      middleware: this.env('STRUCTURE_MIDDLEWARE_DIR', 'app/Http/Middleware'),
      requests: this.env('STRUCTURE_REQUESTS_DIR', 'app/Http/Requests'),
      models: this.env('STRUCTURE_MODELS_DIR', 'app/Models'),
      policies: this.env('STRUCTURE_POLICIES_DIR', 'app/Policies'),
      routes: this.env('STRUCTURE_ROUTES_DIR', 'routes'),
      commands: this.env('STRUCTURE_COMMANDS_DIR', 'app/Console/Commands'),
      schemas: this.env('STRUCTURE_SCHEMAS_DIR', 'database/schemas'),
      seeders: this.env('STRUCTURE_SEEDERS_DIR', 'database/seeds')
    };
  }

  get app(): AppConfig {
    return this.get<AppConfig>('app');
  }

  get database(): DatabaseConfig {
    return this.get<DatabaseConfig>('database');
  }

  get auth(): AuthConfig {
    return this.get<AuthConfig>('auth');
  }

  get cors(): CorsConfig {
    return this.get<CorsConfig>('cors');
  }

  get rate_limit(): RateLimitConfig {
    return this.get<RateLimitConfig>('rate_limit');
  }

  get encryption(): EncryptionConfig {
    return this.get<EncryptionConfig>('encryption');
  }

  get filesystems(): FilesystemsConfig {
    return this.get<FilesystemsConfig>('filesystems');
  }

  get structure(): StructureConfig {
    return this.get<StructureConfig>('structure');
  }

  private env(key: string, defaultValue: any = null): any {
    const value = process.env[key];

    if (value === undefined) {
      return defaultValue;
    }

    // Parse boolean strings
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Parse null/empty
    if (value === 'null') return null;
    if (value === '') return '';

    // Only parse as number if the key is known to be numeric
    const numericKeys = ['DB_PORT', 'DB_POOL_MAX', 'DB_POOL_MIN', 'REDIS_PORT', 'REDIS_DB', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX'];
    if (numericKeys.includes(key)) {
      const num = Number(value);
      if (!isNaN(num)) return num;
    }

    return value;
  }
}

export const config = new Config();
