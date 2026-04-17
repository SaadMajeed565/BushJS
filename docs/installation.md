# Installation

Install Bush.js and run your first application.

## Requirements

- Node.js 18+
- npm 9+ (or yarn/pnpm)
- MongoDB (local, Docker, or hosted)

## Create a new app

```bash
npx bushjs-cli new my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

## Local Development Against Unpublished Repositories

Install runtime package from local path:

```bash
npm install /path/to/bush-js-framework
```

Run CLI from local source:

```bash
npx /path/to/bush-js-cli/core/src/cli.js new my-app
```

## Global Command Install (Optional)

Use this if you want `bush` available from anywhere:

```bash
npm install -g bushjs-cli
bush --help
```

`bush` provides the `new` project setup command. File generators run through the framework console commands in your project.

## Verify Install

Check:

1. `npm run dev` starts cleanly
2. `http://localhost:3000/health` returns a successful response
3. `npm run migrate` completes without database errors

## Production Notes

- Keep command tooling as a dev tool; do not rely on it at runtime
- Configure secrets through environment variables
- Use a managed MongoDB or secured self-hosted instance

---
**Previous:** [Introduction](introduction.md) | **Next:** [Getting Started](getting-started.md)
