"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.Auth = exports.TokenGuard = exports.SessionGuard = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Config_1 = require("../Config/Config");
class SessionGuard {
    setProvider(provider) {
        this.provider = provider;
    }
    async check(request) {
        return !!request.session?.userId;
    }
    async user(request) {
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
        const authUser = {
            ...userRecord,
            id: userRecord._id?.toString?.() ?? userRecord.id,
        };
        request.user = authUser;
        return authUser;
    }
    id(request) {
        return request.session?.userId || null;
    }
    async validate(credentials) {
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
        const passwordMatches = await bcrypt_1.default.compare(credentials.password, userRecord.password);
        if (!passwordMatches) {
            return null;
        }
        return {
            ...userRecord,
            id: userRecord._id?.toString?.() ?? userRecord.id,
        };
    }
    login(request, user) {
        if (!request.session) {
            throw new Error('Session middleware is required for login.');
        }
        request.session.userId = user.id;
        request.user = user;
    }
    logout(request) {
        if (request.session) {
            delete request.session.userId;
        }
        request.user = null;
    }
}
exports.SessionGuard = SessionGuard;
class TokenGuard {
    constructor() {
        this.secret = Config_1.config.auth.jwt_secret;
    }
    setProvider(provider) {
        this.provider = provider;
    }
    async check(request) {
        const token = this.getTokenFromRequest(request);
        if (!token) {
            return false;
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.secret);
            request.userId = payload.sub;
            return true;
        }
        catch {
            return false;
        }
    }
    async user(request) {
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
        const authUser = {
            ...userRecord,
            id: userRecord._id?.toString?.() ?? userRecord.id,
        };
        request.user = authUser;
        return authUser;
    }
    id(request) {
        if (request.userId) {
            return request.userId;
        }
        const token = this.getTokenFromRequest(request);
        if (!token) {
            return null;
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.secret);
            return payload.sub;
        }
        catch {
            return null;
        }
    }
    async validate(credentials) {
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
        const passwordMatches = await bcrypt_1.default.compare(credentials.password, userRecord.password);
        if (!passwordMatches) {
            return null;
        }
        return {
            ...userRecord,
            id: userRecord._id?.toString?.() ?? userRecord.id,
        };
    }
    login(request, user) {
        const payload = { sub: user.id };
        if (user.email)
            payload.email = user.email;
        if (user.name)
            payload.name = user.name;
        request.token = jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: '7d' });
        request.user = user;
    }
    logout(request) {
        // For token auth, logout is handled client-side by discarding the token
        request.user = null;
        request.token = undefined;
    }
    getTokenFromRequest(request) {
        const rawAuth = request.headers.authorization;
        const authHeader = typeof rawAuth === 'string'
            ? rawAuth
            : Array.isArray(rawAuth)
                ? rawAuth.find((h) => typeof h === 'string' && h.startsWith('Bearer '))
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
    async userFromTokenString(rawToken) {
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
        let userId;
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.secret);
            if (!payload?.sub) {
                return null;
            }
            userId = String(payload.sub);
        }
        catch {
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
exports.TokenGuard = TokenGuard;
class Auth {
    constructor() {
        this.guards = new Map();
    }
    setUserProvider(provider) {
        this.provider = provider;
        for (const guard of this.guards.values()) {
            if ('setProvider' in guard) {
                guard.setProvider(provider);
            }
        }
        return this;
    }
    register(name, guard) {
        if (this.provider && 'setProvider' in guard) {
            guard.setProvider(this.provider);
        }
        this.guards.set(name, guard);
        return this;
    }
    guard(name = 'web') {
        return this.guards.get(name) || new SessionGuard();
    }
    check(request, name = 'web') {
        return Promise.resolve(this.guard(name).check(request));
    }
    user(request, name = 'web') {
        return this.guard(name).user(request);
    }
    /**
     * Resolve a user from a raw JWT (e.g. WebSocket JSON `{ type: "auth", token }`).
     * Only supported for the **`api`** (token) guard; other guards return null.
     */
    async userFromToken(token, guardName = 'api') {
        const guard = this.guard(guardName);
        if (guard instanceof TokenGuard) {
            return guard.userFromTokenString(token);
        }
        return null;
    }
    id(request, name = 'web') {
        return this.guard(name).id(request);
    }
    async attempt(request, credentials, guardName = 'web') {
        const user = await this.guard(guardName).validate(credentials);
        if (user) {
            this.guard(guardName).login(request, user);
            return true;
        }
        return false;
    }
    login(request, user, guardName = 'web') {
        this.guard(guardName).login(request, user);
    }
    logout(request, guardName = 'web') {
        this.guard(guardName).logout(request);
    }
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, 10);
    }
    generateToken(user) {
        const payload = { sub: user.id ?? user._id?.toString?.() };
        if (user.email)
            payload.email = user.email;
        if (user.name)
            payload.name = user.name;
        return jsonwebtoken_1.default.sign(payload, Config_1.config.auth.jwt_secret, { expiresIn: '7d' });
    }
}
exports.Auth = Auth;
exports.auth = new Auth();
exports.auth.register('web', new SessionGuard());
exports.auth.register('api', new TokenGuard());
//# sourceMappingURL=Auth.js.map