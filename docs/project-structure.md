# Project Structure

This page shows developers where to put new code in a Bush.js app.

## Generated application structure

```text
my-app/
  app/
    Http/
      Controllers/
      Middleware/
      Requests/
    Models/
    Policies/
  config/
  routes/
  src/
  package.json
  tsconfig.json
  .env.example
```

## What you will edit

### `app/Http/Controllers/`
Add controllers for your app features.

Example:

- `UserController` for user endpoints
- `PostController` for blog posts

### `app/Http/Middleware/`
Add middleware for request handling before controllers.

Use it for:

- authentication
- logging
- request validation
- rate limiting

### `app/Http/Requests/`
Add request classes for validation and authorization.

Use request classes to keep controllers clean.

### `app/Models/`
Put your data access logic here.

Use models to:

- query data
- save records
- prepare output

### `app/Policies/`
Add authorization rules here.

Use policies when you need to protect actions like update or delete.

### `config/`
Put application settings here.

Use `config/` for values such as:

- app name
- database connection
- auth secrets
- CORS or feature flags

### `routes/`
Put your route definitions here.

A route file maps URLs to controller actions.

### `src/`
This folder boots the application.

You usually only edit it to:

- load routes
- register middleware
- start the server

### `package.json`
Use this for app dependencies and scripts.

### `tsconfig.json`
This file controls TypeScript compilation.

## Developer workflow

1. define a route in `routes/`
2. generate or create a controller in `app/Http/Controllers/`
3. validate input with a request in `app/Http/Requests/`
4. access data in `app/Models/`
5. protect actions with `app/Policies/`

This layout helps you build features fast and keep code organized.
