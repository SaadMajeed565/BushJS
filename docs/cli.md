# Command Reference

This page lists project commands used in Basics and Advanced workflows.

## Project setup command

### Available setup command

```bash
bush new <project-name>
```

This creates a new project directory and updates `package.json` name.

### Help output

```bash
bush --help
```

Shows:

- `new <project-name>` create a new Bush.js application

## Framework console commands

Inside a project, use:

```bash
npm run bush:console -- <command>
```

Examples:

```bash
npm run bush:console -- make:model Product
npm run bush:console -- make:controller OrderController
npm run bush:console -- make:middleware EnsureAdmin
npm run bush:console -- make:request StoreOrderRequest
npm run bush:console -- make:policy OrderPolicy
npm run bush:console -- make:schema create_orders
npm run bush:console -- make:seeder OrderSeeder
npm run bush:console -- schema
npm run bush:console -- seed
```

You can also run:

```bash
npx bushjs-console
```

## Command Families

- **Scaffolding**: create project or files
- **Database lifecycle**: schema and seed execution
- **Operational scripts**: migrate/build/start/test

## Typical bootstrap flow

```bash
npx bushjs-cli new my-app
cd my-app
npm install
cp .env.example .env
npm run migrate
npm run dev
```

---
**Previous:** [Realtime & WebSockets](realtime-websockets.md) | **Next:** [Generators](generators.md)
