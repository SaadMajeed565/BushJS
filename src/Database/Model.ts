import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { getDefaultConnection } from './Connection';
import { QueryBuilder } from './QueryBuilder';
import { NotFoundException } from '../Exceptions/HttpExceptions';

type FieldDef = {
  type: 'string' | 'int' | 'integer' | 'bool' | 'boolean' | 'date' | 'objectid' | 'objectId';
  required?: boolean;
  unique?: boolean;
  default?: unknown;
};

type InferField<T> =
  T extends { type: 'string' } ? string :
  T extends { type: 'int' | 'integer' } ? number :
  T extends { type: 'boolean' | 'bool' } ? boolean :
  T extends { type: 'date' } ? Date :
  T extends { type: 'objectid' | 'objectId' } ? string :
  unknown;

type InferDocument<F> = {
  [K in keyof F & string]: InferField<F[K]>;
} & {
  _id: string;
  created_at?: Date;
  updated_at?: Date;
};

type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
};

export interface IModel extends Document {
  _id: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

export abstract class Model {
  static collection = '';
  static schema?: Schema;
  static fields?: Record<string, FieldDef>;
  static model: MongooseModel<any>;

  protected document: Document;

  constructor(attributes: Record<string, unknown> = {}) {
    const ModelClass = this.constructor as typeof Model;
    if (!ModelClass.model) {
      ModelClass.initialize();
    }
    this.document = new ModelClass.model(attributes);
  }

  static initialize(): void {
    if (this.fields) {
      const mongooseSchemaDefinition: any = {};
      for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
        mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
      }
      mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
      mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
      this.schema = new Schema(mongooseSchemaDefinition, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
      });
    } else if (!this.schema) {
      this.schema = new Schema({
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
      }, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
      });
    }

    const conn = getDefaultConnection().getConnection();
    if (conn.models[this.collection]) {
      delete conn.models[this.collection];
    }

    this.model = conn.model(this.collection, this.schema as Schema);
  }

  protected static ensureInitialized(this: typeof Model): void {
    if (!this.model) {
      this.initialize();
    }
  }

  private static mapFieldToMongoose(fieldDef: FieldDef): any {
    const mongooseDef: Record<string, unknown> = {};

    switch (fieldDef.type) {
      case 'string':
        mongooseDef.type = String;
        break;
      case 'int':
      case 'integer':
        mongooseDef.type = Number;
        break;
      case 'bool':
      case 'boolean':
        mongooseDef.type = Boolean;
        break;
      case 'date':
        mongooseDef.type = Date;
        break;
      case 'objectid':
      case 'objectId':
        mongooseDef.type = Schema.Types.ObjectId;
        break;
      default:
        mongooseDef.type = String;
    }

    if (fieldDef.required !== undefined) mongooseDef.required = fieldDef.required;
    if (fieldDef.unique !== undefined) mongooseDef.unique = fieldDef.unique;
    if (fieldDef.default !== undefined) mongooseDef.default = fieldDef.default;

    return mongooseDef;
  }

  static query<T extends typeof Model>(this: T): QueryBuilder<InferDocument<T['fields']>> {
    this.ensureInitialized();
    return new QueryBuilder(this.model);
  }

  static async all<T extends typeof Model>(this: T): Promise<InferDocument<T['fields']>[]> {
    return await this.query().get() as InferDocument<T['fields']>[];
  }

  static async find<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']> | null> {
    this.ensureInitialized();
    return await this.model.findById(id) as InferDocument<T['fields']> | null;
  }

  static async create<T extends typeof Model>(this: T, attributes: Partial<InferDocument<T['fields']>>): Promise<InferDocument<T['fields']>> {
    this.ensureInitialized();
    return await this.model.create(attributes) as InferDocument<T['fields']>;
  }

  static async first<T extends typeof Model>(this: T): Promise<InferDocument<T['fields']> | null> {
    return await this.query().first() as InferDocument<T['fields']> | null;
  }

  static where<T extends typeof Model>(this: T, column: string, value: unknown): QueryBuilder<InferDocument<T['fields']>> {
    return this.query().where(column, value) as QueryBuilder<InferDocument<T['fields']>>;
  }

  static async findOrFail<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']>> {
    const result = await this.find(id);
    if (!result) {
      throw new NotFoundException(this.name, typeof id === 'string' ? id : id.toString());
    }
    return result;
  }

  static async update<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId, attributes: Partial<InferDocument<T['fields']>>): Promise<InferDocument<T['fields']> | null> {
    this.ensureInitialized();
    return await this.model.findByIdAndUpdate(id, attributes, { new: true }) as InferDocument<T['fields']> | null;
  }

  static async delete<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']> | null> {
    this.ensureInitialized();
    return await this.model.findByIdAndDelete(id) as InferDocument<T['fields']> | null;
  }

  static async paginate<T extends typeof Model>(this: T, page = 1, perPage = 15): Promise<PaginatedResult<InferDocument<T['fields']>>> {
    this.ensureInitialized();
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.model.find().skip(skip).limit(perPage),
      this.model.countDocuments(),
    ]);

    return {
      data: data as InferDocument<T['fields']>[],
      total,
      page,
      perPage,
    };
  }

  static hasMany<T extends typeof Model>(
    this: T,
    relatedModel: T,
    foreignKey?: string,
    localKey = '_id'
  ): HasManyRelation {
    return new HasManyRelation(this, relatedModel, foreignKey, localKey);
  }

  static belongsTo<T extends typeof Model>(
    this: T,
    relatedModel: T,
    foreignKey?: string,
    ownerKey = '_id'
  ): BelongsToRelation {
    return new BelongsToRelation(this, relatedModel, foreignKey, ownerKey);
  }

  get(key: string): unknown {
    return this.document.get(key);
  }

  set(key: string, value: unknown): void {
    this.document.set(key, value);
  }

  async save(): Promise<Document> {
    return await this.document.save();
  }

  toJSON(): Record<string, unknown> {
    return this.document.toJSON();
  }

  toObject(): Record<string, unknown> {
    return this.document.toObject();
  }
}

export class HasManyRelation {
  constructor(
    private parentModel: typeof Model,
    private relatedModel: typeof Model,
    private foreignKey?: string,
    private localKey = '_id'
  ) {}

  async get(parentId: unknown): Promise<Document[]> {
    const fk = this.foreignKey || `${this.parentModel.collection.slice(0, -1)}_id`;
    return await this.relatedModel.model.find({ [fk]: parentId });
  }
}

export class BelongsToRelation {
  constructor(
    private parentModel: typeof Model,
    private relatedModel: typeof Model,
    private foreignKey?: string,
    private ownerKey = '_id'
  ) {}

  async get(foreignKeyValue: unknown): Promise<Document | null> {
    return await this.relatedModel.model.findById(foreignKeyValue);
  }
}
