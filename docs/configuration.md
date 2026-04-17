# Configuration

Bush.js reads configuration via `config` and environment variables.

## Environment variables

Create `.env` and define core values:

```env
NODE_ENV=development
APP_NAME=Bush App
APP_URL=http://localhost:3000

DB_CONNECTION=mongodb
DB_HOST=127.0.0.1
DB_PORT=27017
DB_DATABASE=bush_app

AUTH_GUARD=api
AUTH_JWT_SECRET=change-me
AUTH_SESSION_SECRET=change-me-too
```

## Accessing config

```ts
import { config } from 'bushjs';

const appName = config.app.name;
const isProd = config.app.env === 'production';
const jwtSecret = config.auth.jwt_secret;
```

## Important auth settings

- `AUTH_GUARD` default guard (`api` or `web`)
- `AUTH_JWT_SECRET` JWT signing/verifying secret
- `AUTH_SESSION_SECRET` express-session secret

## CORS and rate limit

Bush.js HTTP kernel applies security defaults (Helmet, CORS, global rate limiting). Customize values through your config/environment and restart the server.

## Environment switching

```bash
NODE_ENV=production npm run start
```

Keep production secrets outside source control and injected by deployment environment.

---
**Previous:** [App Directory](app-directory.md) | **Next:** [Routing](routing.md)
