let mockModelCtor: any;

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  mockModelCtor = jest.fn().mockImplementation(function (this: any, attrs: any) {
    const doc: Record<string, any> = {};
    this.get = jest.fn((key: string) => attrs?.[key]);
    this.set = jest.fn((key: string, val: any) => { attrs[key] = val; });
    this.save = jest.fn().mockResolvedValue(this);
    this.toJSON = jest.fn(() => ({ ...attrs }));
    this.toObject = jest.fn(() => ({ ...attrs }));
  });
  mockModelCtor.find = jest.fn();
  mockModelCtor.findById = jest.fn();
  mockModelCtor.create = jest.fn();
  mockModelCtor.findByIdAndUpdate = jest.fn();
  mockModelCtor.findByIdAndDelete = jest.fn();
  mockModelCtor.countDocuments = jest.fn();

  const mockMongoose = {
    ...actual,
    Schema: jest.fn(),
    model: jest.fn().mockReturnValue(mockModelCtor),
    connection: {
      on: jest.fn(),
      readyState: 0,
      models: {} as Record<string, any>,
      close: jest.fn(),
    },
    Types: { ObjectId: actual.Types.ObjectId },
  };
  mockMongoose.default = mockMongoose;
  mockMongoose.Schema.Types = { ObjectId: actual.Schema.Types.ObjectId };
  return mockMongoose;
});

jest.mock('../../../src/Database/Connection', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mongoose = require('mongoose');
  return {
    getDefaultConnection: jest.fn(() => ({
      getConnection: jest.fn().mockReturnValue(mongoose),
    })),
  };
});

import { Model } from '../../../src/Database/Model';
import { NotFoundException } from '../../../src/Exceptions/HttpExceptions';

function mockQuery(data: any[] = []): any {
  const exec = jest.fn().mockResolvedValue(data);
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec,
    then(resolve: any) { return exec().then(resolve); },
  };
}

class TestModel extends Model {
  static collection = 'test_collection';
  static fields = {
    name: { type: 'string' as const },
    age: { type: 'integer' as const },
    active: { type: 'boolean' as const },
  };
}

describe('Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TestModel.model = undefined as any;
  });

  describe('initialize', () => {
    it('creates a Mongoose model', () => {
      TestModel.initialize();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mongoose = require('mongoose');
      expect(mongoose.Schema).toHaveBeenCalled();
      expect(mongoose.model).toHaveBeenCalledWith('test_collection', expect.any(Object));
      expect(TestModel.model).toBeDefined();
    });
  });

  describe('query', () => {
    it('returns a QueryBuilder', () => {
      const qb = TestModel.query();
      expect(qb.constructor.name).toBe('QueryBuilder');
    });
  });

  describe('all', () => {
    it('fetches all documents', async () => {
      mockModelCtor.find.mockReturnValue(mockQuery([{ _id: '1', name: 'A' }]));
      const results = await TestModel.all();
      expect(results).toHaveLength(1);
    });
  });

  describe('find', () => {
    it('finds a document by ID', async () => {
      mockModelCtor.findById.mockResolvedValue({ _id: '1', name: 'Found' });
      const result = await TestModel.find('1');
      expect(mockModelCtor.findById).toHaveBeenCalledWith('1');
      expect(result).toMatchObject({ _id: '1', name: 'Found' });
    });

    it('returns null when not found', async () => {
      mockModelCtor.findById.mockResolvedValue(null);
      const result = await TestModel.find('999');
      expect(result).toBeNull();
    });
  });

  describe('findOrFail', () => {
    it('returns document when found', async () => {
      mockModelCtor.findById.mockResolvedValue({ _id: '1' });
      const result = await TestModel.findOrFail('1');
      expect(result).toMatchObject({ _id: '1' });
    });

    it('throws NotFoundException when not found', async () => {
      mockModelCtor.findById.mockResolvedValue(null);
      await expect(TestModel.findOrFail('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a document', async () => {
      mockModelCtor.create.mockResolvedValue({ _id: 'new-id', name: 'New' });
      const result = await TestModel.create({ name: 'New' });
      expect(mockModelCtor.create).toHaveBeenCalledWith({ name: 'New' });
      expect(result).toMatchObject({ _id: 'new-id', name: 'New' });
    });
  });

  describe('where', () => {
    it('returns a QueryBuilder with condition', () => {
      const qb = TestModel.where('name', 'John');
      expect((qb as any).conditions).toEqual({ name: 'John' });
    });
  });

  describe('first', () => {
    it('returns first document', async () => {
      mockModelCtor.find.mockReturnValue(mockQuery([{ _id: '1', name: 'First' }]));
      const result = await TestModel.first();
      expect(result).toMatchObject({ _id: '1', name: 'First' });
    });
  });

  describe('update', () => {
    it('updates a document by ID', async () => {
      mockModelCtor.findByIdAndUpdate.mockResolvedValue({ _id: '1', name: 'Updated' });
      const result = await TestModel.update('1', { name: 'Updated' });
      expect(mockModelCtor.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Updated' }, { new: true });
      expect(result).toMatchObject({ _id: '1', name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('deletes a document by ID', async () => {
      mockModelCtor.findByIdAndDelete.mockResolvedValue({ _id: '1' });
      const result = await TestModel.delete('1');
      expect(mockModelCtor.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toMatchObject({ _id: '1' });
    });
  });

  describe('paginate', () => {
    it('returns paginated results', async () => {
      mockModelCtor.find.mockReturnValue(mockQuery([{ _id: '1' }, { _id: '2' }]));
      mockModelCtor.countDocuments.mockResolvedValue(20);
      const result = await TestModel.paginate(1, 10);
      expect(result).toMatchObject({
        data: [{ _id: '1' }, { _id: '2' }],
        total: 20,
        page: 1,
        perPage: 10,
      });
    });
  });

  describe('instance methods', () => {
    it('get/set values on document', () => {
      const doc = new TestModel({ name: 'Test' });
      expect(doc.get('name')).toBe('Test');
      doc.set('name', 'Updated');
      expect(doc.get('name')).toBe('Updated');
    });

    it('save delegates to document.save', async () => {
      const doc = new TestModel({ name: 'Test' });
      const saveSpy = jest.spyOn((doc as any).document, 'save').mockResolvedValue({ _id: '1' });
      await doc.save();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('toJSON delegates to document', () => {
      const doc = new TestModel({ name: 'JSON' });
      const spy = jest.spyOn((doc as any).document, 'toJSON').mockReturnValue({ name: 'JSON' });
      expect(doc.toJSON()).toEqual({ name: 'JSON' });
      expect(spy).toHaveBeenCalled();
    });
  });
});
