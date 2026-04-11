# Generators

Generators are the developer tools for quickly creating new app files.

## Controller generator

Create a new controller:

```bash
bush make:controller ArticleController
```

Where it appears:

- `app/Http/Controllers/ArticleController.ts`

What to do next:

- add route definitions in `routes/`
- implement action methods for the controller

## Middleware generator

Create middleware:

```bash
bush make:middleware Authenticate
```

Where it appears:

- `app/Http/Middleware/Authenticate.ts`

What to do next:

- attach it to routes in `routes/`
- use it to protect endpoints or modify requests

## Request generator

Create a request validation class:

```bash
bush make:request StoreArticleRequest
```

Where it appears:

- `app/Http/Requests/StoreArticleRequest.ts`

What to do next:

- add your validation rules
- use the request in controller methods

## Policy generator

Create a policy:

```bash
bush make:policy ArticlePolicy
```

Where it appears:

- `app/Policies/ArticlePolicy.ts`

What to do next:

- check permissions in your controllers
- call policy methods before updating or deleting resources

## Command generator

Create a console command:

```bash
bush make:command CleanCacheCommand
```

Where it appears:

- `src/Console/Commands/CleanCacheCommand.ts`

What to do next:

- wire the command into the console kernel
- run it from the terminal

## Route generator

Create a route file:

```bash
bush make:route api
```

Where it appears:

- `routes/api.ts`

What to do next:

- import controllers
- register paths with `router.get`, `router.post`, etc.

## Use generators as a workflow

1. generate a controller
2. generate a request for validation
3. add the route
4. implement the controller action

This keeps your app consistent and reduces errors.
