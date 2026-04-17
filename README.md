# Bush.js

A Laravel-inspired Node.js framework built with Express.js and MongoDB.

## Features

- 🚀 Express.js HTTP server with middleware support
- 🍃 MongoDB integration with Mongoose ODM
- 🛣️ Laravel-style routing with controllers
- 🔐 Authentication system with guards and middleware
- ✅ Request validation with custom rules
- 📊 Database schemas and seeders
- 🎯 Service container for dependency injection
- 🖥️ CLI commands for scaffolding
- 📁 Laravel-like folder structure
- 📚 Comprehensive documentation with examples in `docs/`

## Requirements

- Node.js 16+
- MongoDB 4.0+
- npm or yarn

## Create a new project

Project scaffolding is handled by the CLI package, not by the framework core.

Install the CLI package and use:

```bash
npx bush new project-name
```

Then install dependencies and run:

```bash
cd project-name
npm install
npm run dev
```

## CLI generators

Once your project is created, you can scaffold common pieces with:

```bash
npx bush make:controller MyController
npx bush make:model User
npx bush make:middleware AuthMiddleware
npx bush make:request RegisterRequest
npx bush make:policy UserPolicy
npx bush make:route users
npx bush make:command SampleCommand
```

## Installation

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb

   # macOS with Homebrew
   brew install mongodb-community

   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Clone and install:**
   ```bash
   git clone <repository>
   cd bush-js
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Start MongoDB:**
   ```bash
   # If installed locally
   sudo systemctl start mongodb

   # Or with Docker
   docker start mongodb
   ```

## Documentation

Read the full framework docs in [`docs/README.md`](docs/README.md), including guides for:

- routing and controllers
- middleware and validation
- authentication and authorization
- database models and schema files
- GraphQL and realtime WebSockets
- CLI-generated app basics and advanced custom architecture with `bushjs`

## Quick Start

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the development server:**
   ```bash
   npm run dev  # Uses nodemon for auto-restart on file changes
   # or
   npm start    # Production build
   ```

3. **Run schemas:**
   ```bash
   npm run cli make:schema create_users
   npm run cli schema
   ```

4. **Run seeders:**
   ```bash
   npm run cli make:seeder initial_users
   npm run cli seed
   ```

5. **Test the API:**
   ```bash
   curl http://localhost:3000/
   # Returns: "Welcome to bush.js — your Node.js framework"
   ```

## Project Structure

```
bush-js/
├── app/                    # Application code
│   ├── Http/
│   │   ├── Controllers/    # Controller classes
│   │   └── Middleware/     # Custom middleware
│   └── Models/            # Mongoose models
├── routes/                # Route definitions
│   ├── api.ts            # REST routes
│   ├── graphql.ts        # GraphQL registration
│   └── websocket.ts      # WebSocket registration
├── config/               # Configuration files
├── database/             # Database related files
│   └── schemas/          # Schema files
├── src/                  # Framework core

├── storage/              # File storage
├── tests/                # Test files
├── .env                  # Environment variables
└── package.json
```

## API Examples

### Authentication

```bash
# Register a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "admin@bushjs.com"}'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bushjs.com", "password": "password"}'

# Get profile (requires authentication)
curl http://localhost:3000/profile \
  -H "Authorization: Bearer <token>"
```

### Models and Relationships

```typescript
// app/Models/User.ts
import { Model } from '@framework/Database/Model';

export class User extends Model {
  static collection = 'users';

  static initialize(): void {
    this.schema = new Schema<IUser>({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String },
    });
  }
}

// Usage
const users = await User.all();
const user = await User.find('user_id');
```

### Routing

```typescript
// routes/api.ts
import { Application } from '@framework';

export function registerRoutes(app: Application) {
  app.get('/', [WelcomeController, 'index']);
  app.post('/users', [UserController, 'store']).middleware([AuthMiddleware]);
}

// routes/graphql.ts
import { Application } from '@framework';

export function registerRoutes(app: Application) {
  app.graphql('/graphql', schema, rootValue);
}

// routes/websocket.ts
import { Application } from '@framework';

export function registerRoutes(app: Application) {
  app.socket('/chat', ChatSocketHandler);
}
```

### Validation

```typescript
// In a controller
const data = await this.validate(request, {
  name: [rules.required(), rules.min(2), rules.max(50)],
  email: [rules.required(), rules.email()],
});
```

## CLI Commands

```bash
# Create a new controller
npm run cli make:controller UserController

# Create a new model
npm run cli make:model User

# Create a new schema
npm run cli make:schema create_users

# Run schema files
npm run cli schema
```

## Key Differences from Laravel

- **Language:** TypeScript instead of PHP
- **Database:** MongoDB with Mongoose instead of SQL with Eloquent
- **HTTP Server:** Express.js instead of built-in PHP server
- **Package Manager:** npm instead of Composer
- **Syntax:** JavaScript/TypeScript syntax while maintaining Laravel-like patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
