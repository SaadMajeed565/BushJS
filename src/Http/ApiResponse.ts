import { Response } from '../Http/Response';

export class ApiResponse {
  private response: Response;

  constructor(response: Response) {
    this.response = response;
  }

  success(data: any, message = 'Success', status = 200): void {
    this.response.status(status).json({
      success: true,
      message,
      data,
    });
  }

  error(message = 'Error', status = 400, errors: any = null): void {
    const payload: any = {
      success: false,
      message,
    };

    if (errors) {
      payload.errors = errors;
    }

    this.response.status(status).json(payload);
  }

  created(data: any, message = 'Created successfully'): void {
    this.success(data, message, 201);
  }

  noContent(message = 'No content'): void {
    this.response.status(204).json({
      success: true,
      message,
    });
  }

  paginate(data: any[], total: number, page: number, perPage: number, message = 'Data retrieved successfully'): void {
    const totalPages = Math.ceil(total / perPage);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    this.response.json({
      success: true,
      message,
      data,
      pagination: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: totalPages,
        from: (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total),
        has_next: hasNext,
        has_prev: hasPrev,
      },
    });
  }
}

export class Resource {
  protected resource: any;

  constructor(resource: any) {
    this.resource = resource;
  }

  toArray(): Record<string, any> {
    return this.resource;
  }
}

export class ResourceCollection {
  protected resources: any[];

  constructor(resources: any[]) {
    this.resources = resources;
  }

  toArray(): Record<string, any>[] {
    return this.resources.map(resource => {
      if (resource instanceof Resource) {
        return resource.toArray();
      }
      return resource;
    });
  }
}