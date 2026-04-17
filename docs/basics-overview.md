# Basics Overview

Basics is the complete framework development track. It covers how to build and maintain a full backend application using the framework project structure.

## Scope of Basics

Basics covers:

- project structure and directory responsibilities
- request/response flow
- routing, controllers, middleware, and validation
- authentication and authorization
- data layer, GraphQL, and realtime integration
- command usage and file generation

## Core Directory Model

- `app/` - business and domain logic
- `routes/` - transport entry points
- `config/` - application configuration
- `database/` - schema/data lifecycle files
- `scripts/` - utility project scripts
- `src/` - application composition and bootstrap

## End-to-End Request Lifecycle

1. Route is matched in `routes/`
2. Middleware chain runs
3. Controller action executes
4. Validation/auth checks run
5. Model/service logic executes
6. Response is returned

For full details, continue through each Basics page in order from `project-structure.md`.

---
**Previous:** [Basics](basics.md) | **Next:** [Project Structure](project-structure.md)
