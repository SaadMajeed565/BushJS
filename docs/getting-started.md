# Getting Started

This guide teaches you how to create, run, and update your first Bush.js app.

## Prerequisites

- Node.js 18 or newer
- npm or yarn

## 1. Install the CLI

Install the CLI globally to use the `bush` command:

```bash
npm install -g /path/to/bush-js-cli
```

When published, install it like this:

```bash
npm install -g @bushjs/cli
```

If you prefer not to install globally:

```bash
npx /path/to/bush-js-cli/core/src/cli.js new my-app
```

When published, use:

```bash
npx @bushjs/cli new my-app
```

## 2. Create a new app

Create a new project with:

```bash
bush new my-app
```

This creates the starter app in `my-app`.

## 3. Install dependencies

```bash
cd my-app
npm install
```

## 4. Run the app

Start the local server:

```bash
npm run dev
```

Now the app should be running on the configured URL.

## 5. Add your first route

Edit `routes/api.ts` and add a new path:

```ts
import { Router } from '@framework';
import { WelcomeController } from '../app/Http/Controllers/WelcomeController';

export function registerRoutes(router: Router) {
  router.get('/hello', WelcomeController.index);
}
```

Then update `app/Http/Controllers/WelcomeController.ts`:

```ts
export class WelcomeController {
  async index(request, response) {
    return response.json({ message: 'Hello from Bush.js' });
  }
}
```

Reload the app and visit `/hello`.

## 6. What you will edit next

Use these folders to build your app:

- `routes/` — define endpoints
- `app/Http/Controllers/` — implement request logic
- `app/Http/Requests/` — validate input
- `app/Models/` — handle data operations
- `app/Policies/` — enforce permissions

## 7. Use generators to move faster

```bash
bush make:controller UserController
bush make:request StoreUserRequest
bush make:middleware Authenticate
```
