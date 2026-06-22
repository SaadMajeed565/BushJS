import { QueryBuilder } from '../../../src/Database/QueryBuilder';

function mockModel(): any {
  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return {
    find: jest.fn().mockReturnValue(mockQuery),
    countDocuments: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    _mockQuery: mockQuery,
  };
}

describe('QueryBuilder', () => {
  let model: any;
  let builder: QueryBuilder;

  beforeEach(() => {
    model = mockModel();
    builder = new QueryBuilder(model);
  });

  describe('where', () => {
    it('adds a condition', () => {
      builder.where('name', 'John');
      (builder as any).conditions.name.should;
      expect((builder as any).conditions).toEqual({ name: 'John' });
    });

    it('chains multiple conditions', () => {
      builder.where('name', 'John').where('age', 30);
      expect((builder as any).conditions).toEqual({ name: 'John', age: 30 });
    });

    it('returns this for chaining', () => {
      const result = builder.where('x', 1);
      expect(result).toBe(builder);
    });
  });

  describe('whereIn', () => {
    it('adds $in condition', () => {
      builder.whereIn('status', ['active', 'pending']);
      expect((builder as any).conditions).toEqual({ status: { $in: ['active', 'pending'] } });
    });
  });

  describe('whereNotIn', () => {
    it('adds $nin condition', () => {
      builder.whereNotIn('role', ['banned', 'deleted']);
      expect((builder as any).conditions).toEqual({ role: { $nin: ['banned', 'deleted'] } });
    });
  });

  describe('limit', () => {
    it('sets limit value', () => {
      builder.limit(10);
      expect((builder as any).limitValue).toBe(10);
    });
  });

  describe('skip', () => {
    it('sets skip value', () => {
      builder.skip(20);
      expect((builder as any).skipValue).toBe(20);
    });
  });

  describe('orderBy', () => {
    it('sets ascending sort', () => {
      builder.orderBy('name', 'asc');
      expect((builder as any).sortValue).toEqual({ name: 1 });
    });

    it('sets descending sort', () => {
      builder.orderBy('name', 'desc');
      expect((builder as any).sortValue).toEqual({ name: -1 });
    });

    it('defaults to ascending', () => {
      builder.orderBy('name');
      expect((builder as any).sortValue).toEqual({ name: 1 });
    });
  });

  describe('get', () => {
    it('calls model.find with conditions', async () => {
      builder.where('active', true);
      await builder.get();
      expect(model.find).toHaveBeenCalledWith({ active: true });
    });

    it('applies sort, skip, limit to query', async () => {
      const q = model._mockQuery;
      builder.orderBy('name', 'desc').skip(5).limit(10);
      await builder.get();
      expect(q.sort).toHaveBeenCalledWith({ name: -1 });
      expect(q.skip).toHaveBeenCalledWith(5);
      expect(q.limit).toHaveBeenCalledWith(10);
    });

    it('returns results from exec', async () => {
      const docs = [{ id: '1', name: 'Test' }];
      model._mockQuery.exec.mockResolvedValue(docs);
      const result = await builder.get();
      expect(result).toEqual(docs);
    });
  });

  describe('first', () => {
    it('returns first document when results exist', async () => {
      const docs = [{ id: '1' }, { id: '2' }];
      model._mockQuery.exec.mockResolvedValue(docs);
      const result = await builder.first();
      expect(result).toEqual({ id: '1' });
    });

    it('returns null when no results', async () => {
      model._mockQuery.exec.mockResolvedValue([]);
      const result = await builder.first();
      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('calls countDocuments with conditions', async () => {
      builder.where('role', 'admin');
      model.countDocuments.mockResolvedValue(5);
      const result = await builder.count();
      expect(model.countDocuments).toHaveBeenCalledWith({ role: 'admin' });
      expect(result).toBe(5);
    });
  });

  describe('exists', () => {
    it('returns true when count > 0', async () => {
      model.countDocuments.mockResolvedValue(3);
      expect(await builder.exists()).toBe(true);
    });

    it('returns false when count is 0', async () => {
      model.countDocuments.mockResolvedValue(0);
      expect(await builder.exists()).toBe(false);
    });
  });

  describe('delete', () => {
    it('calls deleteMany with conditions', async () => {
      builder.where('expired', true);
      await builder.delete();
      expect(model.deleteMany).toHaveBeenCalledWith({ expired: true });
    });

    it('throws when no where clause is set', async () => {
      await expect(builder.delete()).rejects.toThrow(/where clause/i);
    });
  });

  describe('update', () => {
    it('calls updateMany with conditions and data', async () => {
      builder.where('status', 'old');
      await builder.update({ status: 'new' });
      expect(model.updateMany).toHaveBeenCalledWith({ status: 'old' }, { status: 'new' });
    });

    it('throws when no where clause is set', async () => {
      await expect(builder.update({ name: 'test' })).rejects.toThrow(/where clause/i);
    });
  });
});
