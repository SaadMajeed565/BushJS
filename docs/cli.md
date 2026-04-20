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
npm run bush <command>
```
Or
```bash
node bush <command>
```

Examples:

```bash
npm run bush make:model Product
npm run bush make:controller OrderController
npm run bush make:middleware EnsureAdmin
npm run bush make:request StoreOrderRequest
npm run bush make:policy OrderPolicy
npm run bush make:schema create_orders
npm run bush make:seeder OrderSeeder
npm run bush schema
npm run bush seed
```
Or by using this:
```bash
node bush make:model Product
node bush make:controller OrderController
node bush make:middleware EnsureAdmin
node bush make:request StoreOrderRequest
node bush make:policy OrderPolicy
node bush make:schema create_orders
node bush make:seeder OrderSeeder
node bush schema
node bush seed
```

You can also run:

```bash
npx bush
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
