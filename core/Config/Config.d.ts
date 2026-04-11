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
declare class Config {
    private configs;
    constructor();
    private loadConfigs;
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: any): void;
    private appConfig;
    private databaseConfig;
    private authConfig;
    private corsConfig;
    private rateLimitConfig;
    private encryptionConfig;
    private filesystemsConfig;
    private cacheConfig;
    get app(): AppConfig;
    get database(): DatabaseConfig;
    get auth(): AuthConfig;
    get cors(): CorsConfig;
    get rate_limit(): RateLimitConfig;
    get encryption(): EncryptionConfig;
    get filesystems(): FilesystemsConfig;
    private env;
}
export declare const config: Config;
export {};
//# sourceMappingURL=Config.d.ts.map