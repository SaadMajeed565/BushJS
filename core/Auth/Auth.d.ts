import { Request } from '../Http/Request';
import { AuthUser, UserProvider } from './UserProvider';
export interface Guard {
    check(request: Request): boolean | Promise<boolean>;
    user(request: Request): Promise<AuthUser | null>;
    id(request: Request): string | null;
    validate(credentials: Record<string, any>): Promise<AuthUser | null>;
    login(request: Request, user: AuthUser): void;
    logout(request: Request): void;
}
export interface ProviderAware {
    setProvider(provider: UserProvider): void;
}
export declare class SessionGuard implements Guard, ProviderAware {
    private provider?;
    setProvider(provider: UserProvider): void;
    check(request: Request): Promise<boolean>;
    user(request: Request): Promise<AuthUser | null>;
    id(request: Request): string | null;
    validate(credentials: Record<string, any>): Promise<AuthUser | null>;
    login(request: Request, user: AuthUser): void;
    logout(request: Request): void;
}
export declare class TokenGuard implements Guard, ProviderAware {
    private secret;
    private provider?;
    setProvider(provider: UserProvider): void;
    check(request: Request): Promise<boolean>;
    user(request: Request): Promise<AuthUser | null>;
    id(request: Request): string | null;
    validate(credentials: Record<string, any>): Promise<AuthUser | null>;
    login(request: Request, user: AuthUser): void;
    logout(request: Request): void;
    private getTokenFromRequest;
}
export declare class Auth {
    private provider?;
    private guards;
    setUserProvider(provider: UserProvider): this;
    register(name: string, guard: Guard): this;
    guard(name?: string): Guard;
    check(request: Request, name?: string): Promise<boolean>;
    user(request: Request, name?: string): Promise<AuthUser | null>;
    id(request: Request, name?: string): string | null;
    attempt(request: Request, credentials: Record<string, any>, guardName?: string): Promise<boolean>;
    login(request: Request, user: AuthUser, guardName?: string): void;
    logout(request: Request, guardName?: string): void;
    static hashPassword(password: string): Promise<string>;
    generateToken(user: any): string;
}
export declare const auth: Auth;
//# sourceMappingURL=Auth.d.ts.map