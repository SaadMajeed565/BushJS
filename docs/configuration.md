# Configuration

This page teaches you how to configure a Bush.js application for local development and production.

## `.env`

Copy the provided `.env.example` to `.env` and update values.

Example:

```env
APP_NAME=MyBushApp
NODE_ENV=development
APP_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=my_bush_app
AUTH_JWT_SECRET=replace_this_secret
AUTH_SESSION_SECRET=another_secret
```

## `config/`

Use the `config/` folder for application settings.

Common config files:

- `config/app.ts` — app name, URL, environment, debug
- `config/database.ts` — database connection settings
- `config/auth.ts` — auth and session settings

## How to change the port or URL

Update `config/app.ts` or the `.env` variables.

Then restart the application.

## Access config from code

Use the config helper in controllers and services:

```ts
import { config } from '@framework';

const appUrl = config.app.url;
const debugMode = config.app.debug;
```

## Using config values in controllers

Example:

```ts
import { config } from '@framework';

export class ExampleController {
  async index(request, response) {
    return response.json({ baseUrl: config.app.url });
  }
}
```

## Database settings

Update database values in `.env` and `config/database.ts`.

Example:

```env
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=my_bush_app
```

## Authentication settings

Set your auth secrets in `.env`:

```env
AUTH_JWT_SECRET=replace_this_secret
AUTH_SESSION_SECRET=another_secret
```

## Environment-specific configuration

Bush.js can load `.env.development`, `.env.production`, or other environment files based on `NODE_ENV`.

Set `NODE_ENV` to switch environments:

```bash
NODE_ENV=production npm run start
```

## Recommended workflow

- keep secrets in `.env`
- do not commit `.env` to source control
- use `config/` for settings that should be part of the app repository
- use `.env` for sensitive and machine-specific values
