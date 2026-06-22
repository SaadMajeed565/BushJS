import { ApiResponse } from '../../src/Http/ApiResponse';
import { Response } from '../../src/Http/Response';

function mockResponse(): Response & { _body?: any; _status?: number; _headers: Record<string, string> } {
  const state: { body?: any; statusCode?: number; headers: Record<string, string> } = { headers: {} };
  return {
    _body: undefined,
    _status: undefined,
    _headers: state.headers,
    status(code: number) { state.statusCode = code; return this; },
    send(body?: any) { state.body = body; },
    json(body: any) { state.body = body; },
    header(key: string, value: string) { state.headers[key] = value; return this; },
    get body() { return state.body; },
    get statusCode() { return state.statusCode; },
  } as any;
}

describe('ApiResponse', () => {
  describe('success', () => {
    it('returns 200 with data', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.success({ user: 'John' }, 'OK');
      expect((res as any).statusCode).toBe(200);
      expect((res as any).body).toEqual({ success: true, message: 'OK', data: { user: 'John' } });
    });
  });

  describe('error', () => {
    it('returns 400 with error message', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.error('Bad request', 400);
      expect((res as any).statusCode).toBe(400);
      expect((res as any).body).toEqual({ success: false, message: 'Bad request' });
    });

    it('includes errors object when provided', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.error('Validation failed', 422, { email: ['required'] });
      expect((res as any).body.errors).toEqual({ email: ['required'] });
    });
  });

  describe('created', () => {
    it('returns 201', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.created({ id: 1 });
      expect((res as any).statusCode).toBe(201);
    });
  });

  describe('noContent', () => {
    it('returns 204 with empty body', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.noContent();
      expect((res as any).statusCode).toBe(204);
      expect((res as any).body).toBeUndefined();
    });
  });

  describe('paginate', () => {
    it('returns paginated structure', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      const data = [{ id: 1 }, { id: 2 }];
      api.paginate(data, 10, 1, 2);
      const body = (res as any).body;
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.pagination.total).toBe(10);
      expect(body.pagination.per_page).toBe(2);
      expect(body.pagination.current_page).toBe(1);
      expect(body.pagination.last_page).toBe(5);
      expect(body.pagination.has_next).toBe(true);
      expect(body.pagination.has_prev).toBe(false);
    });

    it('handles empty data set', () => {
      const res = mockResponse();
      const api = new ApiResponse(res as any);
      api.paginate([], 0, 1, 15);
      const body = (res as any).body;
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.last_page).toBe(0);
    });
  });
});
