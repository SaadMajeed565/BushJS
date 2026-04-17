import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { connection } from './Connection';
import { QueryBuilder } from './QueryBuilder';

type Constructor<T> = new (...args: any[]) => T;

export interface IModel extends Document {
  _id: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

export abstract class Model {
  static collection = '';
  static schema: Schema | string | [string, Record<string, any>];
  static fields?: [string, Record<string, any>] | Record<string, any>;
  static model: MongooseModel<any>;

  protected document: Document;

  constructor(attributes: Record<string, any> = {}) {
    const ModelClass = this.constructor as typeof Model;
    if (!ModelClass.model) {
      ModelClass.initialize();
    }
    this.document = new ModelClass.model(attributes);
  }

  static initialize(): void {
    if (!this.schema && !this.fields) {
      this.schema = new Schema({
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
      }, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
      });
    } else if (Array.isArray(this.fields) && this.fields.length === 2 && typeof this.fields[0] === 'string' && typeof this.fields[1] === 'object') {
      // Handle new array format: [schemaName, fields]
      const [schemaName, fieldDefs] = this.fields;
      const mongooseSchemaDefinition: Record<string, any> = {};
      for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
        mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
      }
      mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
      mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
      this.schema = new Schema(mongooseSchemaDefinition, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
      });
    } else if (this.schema instanceof Schema) {
      // Already a Mongoose schema - do nothing
    } else if (Array.isArray(this.schema) && this.schema.length === 2) {
      // Handle legacy array format on schema property
      const [schemaName, fieldDefs] = this.schema;
      if (typeof schemaName === 'string' && typeof fieldDefs === 'object') {
        const mongooseSchemaDefinition: Record<string, any> = {};
        for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
          mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
        }
        mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
        mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
        this.schema = new Schema(mongooseSchemaDefinition, {
          timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
        });
      } else {
        throw new Error(`Invalid schema array format in model ${this.constructor.name}`);
      }
    } else if (typeof this.schema === 'string') {
      // Autodiscover schema class
      const schemaName = this.schema;
      try {
        // Use fields from the model class itself
        const ModelClass = this.constructor as typeof Model;
        if (ModelClass.fields && typeof ModelClass.fields === 'object' && !Array.isArray(ModelClass.fields)) {
          const mongooseSchemaDefinition: Record<string, any> = {};
          for (const [fieldName, fieldDef] of Object.entries(ModelClass.fields)) {
            mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
          }
          mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
          mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
          this.schema = new Schema(mongooseSchemaDefinition, {
            timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
          });
        } else {
          throw new Error(`Model class '${this.constructor.name}' missing static fields.`);
        }
      } catch (error) {
        throw new Error(`Failed to load schema '${schemaName}': ${(error as Error).message}`);
      }
    }

    this.model = connection.getConnection().model(this.collection, this.schema as Schema);
  }

  private static mapFieldToMongoose(fieldDef: any): any {
    const mongooseDef: any = {};
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
    if (fieldDef.required) mongooseDef.required = true;
    if (fieldDef.unique) mongooseDef.unique = true;
    return mongooseDef;
  }

  static query<T extends typeof Model>(this: T): QueryBuilder {
    return new QueryBuilder(this.model);
  }

  static async all<T extends typeof Model>(this: T): Promise<Document[]> {
    return await this.query().get();
  }

  static async find<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document | null> {
    return await this.model.findById(id);
  }

  static async create<T extends typeof Model>(this: T, attributes: Record<string, any>): Promise<Document> {
    return await this.model.create(attributes);
  }

  static async first<T extends typeof Model>(this: T): Promise<Document | null> {
    return await this.query().first();
  }

  static where<T extends typeof Model>(this: T, column: string, value: any): QueryBuilder {
    return this.query().where(column, value);
  }

  static async findOrFail<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document> {
    const result = await this.find(id);
    if (!result) {
      throw new Error(`${this.name} not found`);
    }
    return result;
  }

  static async update<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId, attributes: Record<string, any>): Promise<Document | null> {
    return await this.model.findByIdAndUpdate(id, attributes, { new: true });
  }

  static async delete<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document | null> {
    return await this.model.findByIdAndDelete(id);
  }

  static async paginate<T extends typeof Model>(this: T, page = 1, perPage = 15): Promise<{ data: Document[], total: number, page: number, perPage: number }> {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.model.find().skip(skip).limit(perPage),
      this.model.countDocuments(),
    ]);

    return {
      data,
      total,
      page,
      perPage,
    };
  }

  // Relationship methods
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

  get(key: string): any {
    return this.document.get(key);
  }

  set(key: string, value: any): void {
    this.document.set(key, value);
  }

  async save(): Promise<Document> {
    return await this.document.save();
  }

  toJSON(): Record<string, any> {
    return this.document.toJSON();
  }

  toObject(): Record<string, any> {
    return this.document.toObject();
  }
}

// Relationship classes
export class HasManyRelation {
  constructor(
    private parentModel: typeof Model,
    private relatedModel: typeof Model,
    private foreignKey?: string,
    private localKey = '_id'
  ) {}

  async get(parentId: any): Promise<Document[]> {
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

  async get(foreignKeyValue: any): Promise<Document | null> {
    return await this.relatedModel.model.findById(foreignKeyValue);
  }
}
