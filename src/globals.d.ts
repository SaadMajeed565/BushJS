declare global {
  var Controller: typeof import('./Http/Controller').Controller;
  var Model: typeof import('./Database/Model').Model;
  var Middleware: typeof import('./Http/Middleware/Middleware').Middleware;
  var auth: typeof import('./Auth/Auth').auth;
}

export {};
