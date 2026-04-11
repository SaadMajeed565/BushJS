# CLI Reference

The `bush` CLI is the fastest way to create a new project and generate app files.

## Run the CLI

If installed globally:

```bash
bush --help
```

If not installed globally, use `npx`:

```bash
npx /path/to/bush-js-cli/core/src/cli.js --help
```

When published, use:

```bash
npx @bushjs/cli --help
```

## Create a new app

```bash
bush new my-app
```

This command creates a new project with starter files and a working `package.json`.

## Generate a controller

```bash
bush make:controller UserController
```

Result:

- creates `app/Http/Controllers/UserController.ts`
- adds a skeleton controller class

## Generate middleware

```bash
bush make:middleware Authenticate
```

Result:

- creates `app/Http/Middleware/Authenticate.ts`
- provides a `handle()` method to run before requests

## Generate a request

```bash
bush make:request StoreUserRequest
```

Result:

- creates `app/Http/Requests/StoreUserRequest.ts`
- provides `authorize()` and `rules()` methods for validation

## Generate a policy

```bash
bush make:policy UserPolicy
```

Result:

- creates `app/Policies/UserPolicy.ts`
- provides permission methods like `view()`, `update()`, and `delete()`

## Generate a command

```bash
bush make:command CleanCacheCommand
```

Result:

- creates `src/Console/Commands/CleanCacheCommand.ts`
- provides a `handle()` method for command logic

## Example workflow

1. scaffold the app: `bush new my-app`
2. generate a controller: `bush make:controller PostController`
3. generate a request: `bush make:request StorePostRequest`
4. add a route in `routes/api.ts`

## Tips for developers

- Use generators to avoid writing boilerplate.
- Always check generated files and customize them.
- Keep routes and controllers simple: validation belongs in request classes, and business logic belongs in models or services.
