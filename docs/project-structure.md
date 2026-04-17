# Project Structure

## Standard Structure

```text
my-app/
  app/
    GraphQL/
      Resolvers/
    Http/
      Controllers/
      Middleware/
      Requests/
    Models/
    Policies/
    WebSockets/
  config/
  database/
    schemas/
  routes/
    api.ts
    graphql.ts
    websocket.ts
    index.ts
  scripts/
    migrate.ts
  src/
    app.ts
  storage/
  package.json
  tsconfig.json
  .env
```

## Directory Responsibilities

### `app/`
- Main application/domain code
- HTTP logic (`Controllers`, `Middleware`, `Requests`)
- Data models and policies
- GraphQL resolvers and websocket handlers

### `routes/`
- Route registration split by transport
- `index.ts` as central route composer

### `config/`
- Environment-driven app settings
- Runtime behavior tuning

### `database/`
- Schema files and database lifecycle assets

### `scripts/`
- Script entrypoints for operational tasks

### `src/`
- Application bootstrap and composition

### `storage/`
- Runtime files (uploads, logs, cache, backups)

## Rule of Thumb

- Put business logic in `app/`
- Put wiring/composition in `src/` and `routes/`
- Put environment settings in `config/`

---
**Previous:** [Basics Overview](basics-overview.md) | **Next:** [App Directory](app-directory.md)
