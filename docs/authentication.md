# Authentication

Bush.js supports two built-in guards:

- `web` -> `SessionGuard`
- `api` -> `TokenGuard` (JWT bearer)

## Guard behavior

### Web guard (`web`)

- Uses `request.session.userId`
- Good for browser session/cookie auth

### API guard (`api`)

- Reads bearer token from:
  - `Authorization: Bearer <token>`
  - or `?token=<token>` query param
- Verifies JWT with `AUTH_JWT_SECRET`

## Register a user provider

Auth needs a provider for user lookup and credential validation.

```ts
import { auth, UserProvider } from 'bushjs';

class AppUserProvider implements UserProvider {
  async findById(id: string) {
    return UserModel.find(id);
  }

  async validate(credentials: Record<string, any>) {
    return UserModel.where('email', credentials.email).first();
  }
}

auth.setUserProvider(new AppUserProvider());
```

## Login flow (session guard)

```ts
const ok = await auth.attempt(request, { email: request.input('email'), password: request.input('password') }, 'web');
if (!ok) {
  response.status(401).json({ message: 'Invalid credentials' });
  return;
}
response.json({ message: 'Logged in' });
```

## Login flow (api guard / JWT)

```ts
const ok = await auth.attempt(request, { email: request.input('email'), password: request.input('password') }, 'api');
if (!ok) {
  response.status(401).json({ message: 'Invalid credentials' });
  return;
}
response.json({ token: request.token, user: request.user });
```

## Protecting routes

```ts
import { AuthMiddleware } from 'bushjs';

app.get('/dashboard', [DashboardController, 'index'], [new AuthMiddleware('web')]);
app.get('/api/me', [ProfileController, 'show'], [new AuthMiddleware('api')]);
```

## Helper APIs

- `auth.check(request, guard)`
- `auth.user(request, guard)`
- `auth.id(request, guard)`
- `auth.login(request, user, guard)`
- `auth.logout(request, guard)`
- `auth.generateToken(user)`
- `Auth.hashPassword(password)`

## Notes

- Password reset flow is not built in; implement per app
- Session and token auth can coexist for the same account

## Recommended Auth Flow

1. Register a provider early in app bootstrap
2. Use `auth.attempt` for credential verification
3. Protect endpoints with guard-specific middleware
4. Keep auth-specific responses consistent across endpoints

---
**Previous:** [Validation](validation.md) | **Next:** [Authorization](authorization.md)
