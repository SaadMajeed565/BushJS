# Installation

Bush.js is delivered as two packages:

- `bushjs` — the runtime package with the framework core
- `@bushjs/cli` — the CLI package for scaffolding and generators

## Install the framework package

In a generated application, the runtime package should be installed as a dependency.

For local development, install from the package folder:

```bash
npm install /path/to/bush-js-framework
```

When published, install it like this:

```bash
npm install bushjs
```

## Install the CLI package

The CLI is intended for development and scaffolding.

Install it globally if you want to run `bush` from any directory:

```bash
npm install -g /path/to/bush-js-cli
```

When published, install it like this:

```bash
npm install -g @bushjs/cli
```

If you prefer not to install globally, use `npx`:

```bash
npx /path/to/bush-js-cli/core/src/cli.js new my-app
```

## Recommended workflow

- Use `bushjs` as a runtime dependency in your app.
- Use `@bushjs/cli` for project creation and code generation.
- Avoid shipping the CLI package with production apps.

## Verifying the install

To validate the CLI, run:

```bash
bush --help
```

To validate the framework package in a generated app, start the app and confirm it boots successfully.
