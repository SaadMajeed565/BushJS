# Introduction

Bush.js is a Node.js framework built on top of Express.js and MongoDB, with first-class TypeScript support.  
It is designed for teams who want a practical backend framework that stays simple to start and structured as projects grow.

At its core, Bush.js gives you a clear development flow:

1. define routes
2. handle requests in controllers
3. validate input and enforce access rules
4. work with data models and schema files
5. return API responses consistently

This means you spend less time wiring repeated backend patterns and more time building actual product logic.

## What Bush.js includes

- structured application directories for clean feature organization
- routing with route groups, middleware, and resource-style patterns
- middleware pipeline for authentication, rate limits, and request guards
- validation helpers for request payload checks
- authentication with session and JWT guard support
- policy-based authorization for action-level permission checks
- MongoDB model layer, schema builder, and seeding flow
- GraphQL endpoint support
- WebSocket/realtime support for event-driven features

## How to think about the docs

These docs are split into two practical sections:

- **Basics**: complete app development using the framework structure (`app`, `routes`, `config`, `database`, `scripts`, `src`)
- **Advanced**: deeper core usage for custom architecture and composition patterns

If you are starting a new project, go through Basics in order.  
If you already have specific architecture requirements, use Advanced after finishing the key Basics sections.

## Typical use cases

- API backends for web and mobile apps
- admin panels with role-based access control
- backend services that need both REST and realtime channels
- products that want predictable structure across teams

## Why teams choose Bush.js

- **Clear structure**: new contributors can find where code belongs quickly
- **Reduced boilerplate**: common backend tasks are already shaped into patterns
- **Scalable conventions**: app structure remains manageable as features increase
- **Flexible depth**: you can stay with framework conventions or move into custom architecture when needed

## Start Here

1. [Installation](installation.md)
2. [Getting Started](getting-started.md)
3. [Basics](basics.md)

---
**Previous:** [Docs Home](README.md) | **Next:** [Installation](installation.md)

