import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from '../Http/Request';
import { config } from '../Config/Config';
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

export class SessionGuard implements Guard, ProviderAware {
  private provider?: UserProvider;

  setProvider(provider: UserProvider): void {
    this.provider = provider;
  }

  async check(request: Request): Promise<boolean> {
    return !!request.session?.userId;
  }

  async user(request: Request): Promise<AuthUser | null> {
    if (request.user) {
      return request.user;
    }

    const userId = this.id(request);
    if (!userId) {
      return null;
    }

    if (!this.provider) {
      throw new Error('User provider is not registered.');
    }

    const userRecord = await this.provider.findById(userId);
    if (!userRecord) {
      return null;
    }

    const authUser: AuthUser = {
      ...userRecord,
      id: userRecord._id?.toString?.() ?? userRecord.id,
    };

    request.user = authUser;
    return authUser;
  }

  id(request: Request): string | null {
    return request.session?.userId || null;
  }

  async validate(credentials: Record<string, any>): Promise<AuthUser | null> {
    if (!this.provider) {
      throw new Error('User provider is not registered.');
    }

    if (typeof this.provider.validate !== 'function') {
      throw new Error('User provider must implement validate(credentials) for auth validation.');
    }

    const userRecord = await this.provider.validate(credentials);
    if (!userRecord || !credentials.password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(credentials.password, userRecord.password);
    if (!passwordMatches) {
      return null;
    }

    return {
      ...userRecord,
      id: userRecord._id?.toString?.() ?? userRecord.id,
    };
  }

  login(request: Request, user: AuthUser): void {
    if (!request.session) {
      throw new Error('Session middleware is required for login.');
    }

    request.session.userId = user.id;
    request.user = user;
  }

  logout(request: Request): void {
    if (request.session) {
      delete request.session.userId;
    }
    request.user = null;
  }
}

export class TokenGuard implements Guard, ProviderAware {
  private secret = config.auth.jwt_secret;
  private provider?: UserProvider;

  setProvider(provider: UserProvider): void {
    this.provider = provider;
  }

  async check(request: Request): Promise<boolean> {
    const token = this.getTokenFromRequest(request);
    if (!token) {
      return false;
    }

    try {
      const payload = jwt.verify(token, this.secret) as any;
      request.userId = payload.sub;
      return true;
    } catch {
      return false;
    }
  }

  async user(request: Request): Promise<AuthUser | null> {
    if (request.user) {
      return request.user;
    }

    const userId = this.id(request);
    if (!userId) {
      return null;
    }

    if (!this.provider) {
      throw new Error('User provider is not registered.');
    }

    const userRecord = await this.provider.findById(userId);
    if (!userRecord) {
      return null;
    }

    const authUser: AuthUser = {
      ...userRecord,
      id: userRecord._id?.toString?.() ?? userRecord.id,
    };

    request.user = authUser;
    return authUser;
  }

  id(request: Request): string | null {
    if (request.userId) {
      return request.userId;
    }

    const token = this.getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    try {
      const payload = jwt.verify(token, this.secret) as any;
      return payload.sub;
    } catch {
      return null;
    }
  }

  async validate(credentials: Record<string, any>): Promise<AuthUser | null> {
    if (!this.provider) {
      throw new Error('User provider is not registered.');
    }

    if (typeof this.provider.validate !== 'function') {
      throw new Error('User provider must implement validate(credentials) for auth validation.');
    }

    const userRecord = await this.provider.validate(credentials);
    if (!userRecord || !credentials.password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(credentials.password, userRecord.password);
    if (!passwordMatches) {
      return null;
    }

    return {
      ...userRecord,
      id: userRecord._id?.toString?.() ?? userRecord.id,
    };
  }

  login(request: Request, user: AuthUser): void {
    const payload: Record<string, any> = { sub: user.id };
    if (user.email) payload.email = user.email;
    if (user.name) payload.name = user.name;

    request.token = jwt.sign(payload, this.secret, { expiresIn: '7d' });
    request.user = user;
  }

  logout(request: Request): void {
    // For token auth, logout is handled client-side by discarding the token
    request.user = null;
    request.token = undefined;
  }

  private getTokenFromRequest(request: Request): string | null {
    const rawAuth = request.headers.authorization;
    const authHeader =
      typeof rawAuth === 'string'
        ? rawAuth
        : Array.isArray(rawAuth)
          ? rawAuth.find((h): h is string => typeof h === 'string' && h.startsWith('Bearer '))
          : undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const t = authHeader.slice(7).trim();
      return t.length > 0 ? t : null;
    }
    const q = request.query?.token;
    if (q && typeof q === 'string' && q.trim().length > 0) {
      const t = q.trim();
      return t.startsWith('Bearer ') ? t.slice(7).trim() : t;
    }
    return null;
  }

  /**
   * Verify a JWT string and load the user via the registered provider (same rules as the API guard).
   * Use for WebSocket in-band auth or any non-HTTP bearer context.
   */
  async userFromTokenString(rawToken: string | null | undefined): Promise<AuthUser | null> {
    if (!rawToken?.trim()) {
      return null;
    }
    const token = rawToken.trim().startsWith('Bearer ') ? rawToken.trim().slice(7).trim() : rawToken.trim();
    if (!token) {
      return null;
    }

    if (!this.provider) {
      throw new Error('User provider is not registered.');
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, this.secret) as { sub?: string };
      if (!payload?.sub) {
        return null;
      }
      userId = String(payload.sub);
    } catch {
      return null;
    }

    const userRecord = await this.provider.findById(userId);
    if (!userRecord) {
      return null;
    }

    return {
      ...userRecord,
      id: userRecord._id?.toString?.() ?? userRecord.id,
    };
  }
}

export class Auth {
  private provider?: UserProvider;
  private guards: Map<string, Guard> = new Map();

  setUserProvider(provider: UserProvider): this {
    this.provider = provider;
    for (const guard of this.guards.values()) {
      if ('setProvider' in guard) {
        (guard as any).setProvider(provider);
      }
    }
    return this;
  }

  register(name: string, guard: Guard): this {
    if (this.provider && 'setProvider' in guard) {
      (guard as any).setProvider(this.provider);
    }
    this.guards.set(name, guard);
    return this;
  }

  guard(name = 'web'): Guard {
    return this.guards.get(name) || new SessionGuard();
  }

  check(request: Request, name = 'web'): Promise<boolean> {
    return Promise.resolve(this.guard(name).check(request));
  }

  user(request: Request, name = 'web'): Promise<AuthUser | null> {
    return this.guard(name).user(request);
  }

  /**
   * Resolve a user from a raw JWT (e.g. WebSocket JSON `{ type: "auth", token }`).
   * Only supported for the **`api`** (token) guard; other guards return null.
   */
  async userFromToken(token: string | null | undefined, guardName = 'api'): Promise<AuthUser | null> {
    const guard = this.guard(guardName);
    if (guard instanceof TokenGuard) {
      return guard.userFromTokenString(token);
    }
    return null;
  }

  id(request: Request, name = 'web'): string | null {
    return this.guard(name).id(request);
  }

  async attempt(request: Request, credentials: Record<string, any>, guardName = 'web'): Promise<boolean> {
    const user = await this.guard(guardName).validate(credentials);
    if (user) {
      this.guard(guardName).login(request, user);
      return true;
    }
    return false;
  }

  login(request: Request, user: AuthUser, guardName = 'web'): void {
    this.guard(guardName).login(request, user);
  }

  logout(request: Request, guardName = 'web'): void {
    this.guard(guardName).logout(request);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  generateToken(user: any): string {
    const payload: Record<string, any> = { sub: user.id ?? user._id?.toString?.() };
    if (user.email) payload.email = user.email;
    if (user.name) payload.name = user.name;
    return jwt.sign(payload, config.auth.jwt_secret, { expiresIn: '7d' });
  }
}

export const auth = new Auth();
auth.register('web', new SessionGuard());
auth.register('api', new TokenGuard());
