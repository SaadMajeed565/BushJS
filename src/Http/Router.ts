import { Request } from './Request';

type RouteDefinition = {
  method: string;
  path: string;
  action: any;
  middleware: any[];
  regex: RegExp;
  params: string[];
  name?: string;
};

type RouteGroup = {
  prefix?: string;
  middleware?: any[];
  name?: string;
};

export class Router {
  private routes = new Map<string, RouteDefinition[]>();
  private groups: RouteGroup[] = [];
  private middlewareGroups: Map<string, any[]> = new Map();
  private namedRoutes: Map<string, RouteDefinition> = new Map();

  register(method: string, path: string, action: any, middleware: any[] = []): void {
    const routeMethod = method.toUpperCase();
    const fullPath = this.buildPath(path);
    const resolvedMiddleware = this.resolveMiddleware(middleware);
    const fullMiddleware = [...this.getGroupMiddleware(), ...resolvedMiddleware];
    const [regex, params] = this.compilePath(fullPath);
    const route: RouteDefinition = {
      method: routeMethod,
      path: fullPath,
      action,
      middleware: fullMiddleware,
      regex,
      params,
    };

    const existing = this.routes.get(routeMethod) ?? [];
    existing.push(route);
    this.routes.set(routeMethod, existing);
  }

  get(path: string, action: any, middleware: any[] = []): void {
    this.register('GET', path, action, middleware);
  }

  post(path: string, action: any, middleware: any[] = []): void {
    this.register('POST', path, action, middleware);
  }

  put(path: string, action: any, middleware: any[] = []): void {
    this.register('PUT', path, action, middleware);
  }

  patch(path: string, action: any, middleware: any[] = []): void {
    this.register('PATCH', path, action, middleware);
  }

  delete(path: string, action: any, middleware: any[] = []): void {
    this.register('DELETE', path, action, middleware);
  }

  any(path: string, action: any, middleware: any[] = []): void {
    this.register('ANY', path, action, middleware);
  }

  group(options: RouteGroup, callback: () => void): void {
    this.groups.push(options);
    callback();
    this.groups.pop();
  }

  middlewareGroup(name: string, middleware: any[]): void {
    this.middlewareGroups.set(name, middleware);
  }

  resource(path: string, controller: any, options: { only?: string[], except?: string[], middleware?: any[] } = {}): void {
    const actions = {
      index: 'GET',
      create: 'GET',
      store: 'POST',
      show: 'GET',
      edit: 'GET',
      update: 'PUT',
      destroy: 'DELETE',
    };

    const routes = [
      { name: 'index', method: 'GET', path: '', action: 'index' },
      { name: 'create', method: 'GET', path: '/create', action: 'create' },
      { name: 'store', method: 'POST', path: '', action: 'store' },
      { name: 'show', method: 'GET', path: '/:id', action: 'show' },
      { name: 'edit', method: 'GET', path: '/:id/edit', action: 'edit' },
      { name: 'update', method: 'PUT', path: '/:id', action: 'update' },
      { name: 'destroy', method: 'DELETE', path: '/:id', action: 'destroy' },
    ];

    const only = options.only || Object.keys(actions);
    const except = options.except || [];
    const middleware = options.middleware || [];

    routes.forEach(route => {
      if (only.includes(route.name) && !except.includes(route.name)) {
        this.register(route.method, `${path}${route.path}`, [controller, route.action], middleware);
      }
    });
  }

  apiResource(path: string, controller: any, options: { only?: string[], except?: string[], middleware?: any[] } = {}): void {
    const routes = [
      { name: 'index', method: 'GET', path: '', action: 'index' },
      { name: 'store', method: 'POST', path: '', action: 'store' },
      { name: 'show', method: 'GET', path: '/:id', action: 'show' },
      { name: 'update', method: 'PUT', path: '/:id', action: 'update' },
      { name: 'destroy', method: 'DELETE', path: '/:id', action: 'destroy' },
    ];

    const only = options.only || ['index', 'store', 'show', 'update', 'destroy'];
    const except = options.except || [];
    const middleware = options.middleware || [];

    routes.forEach(route => {
      if (only.includes(route.name) && !except.includes(route.name)) {
        this.register(route.method, `${path}${route.path}`, [controller, route.action], middleware);
      }
    });
  }

  name(name: string): Router {
    // This would be called after registering a route
    // For simplicity, we'll assume the last registered route
    const lastRoute = this.getLastRoute();
    if (lastRoute) {
      lastRoute.name = name;
      this.namedRoutes.set(name, lastRoute);
    }
    return this;
  }

  url(name: string, params: Record<string, string> = {}): string {
    const route = this.namedRoutes.get(name);
    if (!route) {
      throw new Error(`Route ${name} not found`);
    }

    let path = route.path;
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, params[key]);
    });
    return path;
  }

  private buildPath(path: string): string {
    let fullPath = path;
    this.groups.forEach(group => {
      if (group.prefix) {
        fullPath = group.prefix + fullPath;
      }
    });
    return fullPath;
  }

  private getGroupMiddleware(): any[] {
    let middleware: any[] = [];
    this.groups.forEach(group => {
      if (group.middleware) {
        middleware = [...middleware, ...this.resolveMiddleware(group.middleware)];
      }
    });
    return middleware;
  }

  private resolveMiddleware(middleware: any[]): any[] {
    const resolved: any[] = [];
    middleware.forEach(mw => {
      if (typeof mw === 'string') {
        const group = this.middlewareGroups.get(mw);
        if (group) {
          resolved.push(...this.resolveMiddleware(group));
        }
        return;
      }
      resolved.push(mw);
    });
    return resolved;
  }

  private getLastRoute(): RouteDefinition | null {
    for (const routes of this.routes.values()) {
      if (routes.length > 0) {
        return routes[routes.length - 1];
      }
    }
    return null;
  }

  getRoutes(): RouteDefinition[] {
    const allRoutes: RouteDefinition[] = [];
    for (const routes of this.routes.values()) {
      allRoutes.push(...routes);
    }
    return allRoutes;
  }

  match(method: string, path: string): { route: RouteDefinition; params: Record<string, string> } | null {
    const searchMethods = [method.toUpperCase(), 'ANY'];

    for (const routeMethod of searchMethods) {
      const routes = this.routes.get(routeMethod) ?? [];
      for (const route of routes) {
        const matches = route.regex.exec(path);
        if (!matches) {
          continue;
        }

        const params: Record<string, string> = {};
        route.params.forEach((name, index) => {
          params[name] = matches[index + 1];
        });

        return { route, params };
      }
    }

    return null;
  }

  private compilePath(path: string): [RegExp, string[]] {
    const segments = path.split('/').filter((segment) => segment.length > 0);
    const params: string[] = [];
    const pattern = segments
      .map((segment) => {
        if (segment.startsWith(':')) {
          params.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    const regex = new RegExp(`^/${pattern}$`);
    return [regex, params];
  }
}
