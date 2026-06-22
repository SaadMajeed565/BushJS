import { getDefaultConnection } from './Connection';
import { logger } from '../Foundation/ExceptionHandler';

export interface Schema {
  up(): Promise<void> | void;
  down(): Promise<void> | void;
}

export interface IndexDefinition {
  fields: Record<string, 1 | -1>;
  options?: Record<string, any>;
}

export abstract class BaseSchema implements Schema {
  abstract up(): Promise<void> | void;
  abstract down(): Promise<void> | void;

  protected async createTable(tableName: string, callback: (schema: SchemaBuilder) => void): Promise<void> {
    await this.createCollection(tableName, callback);
  }

  protected async createCollection(collectionName: string, callback: (schema: SchemaBuilder) => void): Promise<void> {
    const schema = new SchemaBuilder(collectionName);
    callback(schema);

    const db = getDefaultConnection().getConnection().connection.db;
    if (!db) {
      throw new Error('MongoDB connection is not established');
    }

    const options: Record<string, any> = {};
    const validator = schema.getValidator();

    if (validator) {
      options.validator = validator;
    }

    try {
      await db.createCollection(collectionName, options);
      logger.info(`Created collection: ${collectionName}`);
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      if (err.codeName === 'NamespaceExists' || err.code === 48) {
        logger.info(`Collection already exists: ${collectionName}`);
      } else {
        throw error;
      }
    }

    if (schema.indexes.length > 0) {
      await this.createIndexes(collectionName, schema.indexes);
    }
  }

  protected async createIndexes(collectionName: string, indexes: IndexDefinition[]): Promise<void> {
    const db = getDefaultConnection().getConnection().connection.db;
    if (!db) {
      throw new Error('MongoDB connection is not established');
    }
    const collection = db.collection(collectionName);

    for (const index of indexes) {
      await collection.createIndex(index.fields, index.options);
      logger.info(`Created index for ${collectionName}`, { fields: index.fields, options: index.options });
    }
  }

  protected async dropTable(tableName: string): Promise<void> {
    await this.dropCollection(tableName);
  }

  protected async dropCollection(collectionName: string): Promise<void> {
    const db = getDefaultConnection().getConnection().connection.db;
    if (!db) {
      throw new Error('MongoDB connection is not established');
    }
    const exists = await db.listCollections({ name: collectionName }).hasNext();

    if (exists) {
      await db.dropCollection(collectionName);
      logger.info(`Dropped collection: ${collectionName}`);
    } else {
      logger.info(`Collection does not exist: ${collectionName}`);
    }
  }
}

export class SchemaBuilder {
  public fields: FieldDefinition[] = [];
  public indexes: IndexDefinition[] = [];

  constructor(public collectionName: string) {}

  id(fieldName = '_id'): this {
    this.fields.push({
      name: fieldName,
      type: 'objectId',
      primary: true,
      required: true,
    });
    return this;
  }

  objectId(fieldName: string, required = false): this {
    this.fields.push({
      name: fieldName,
      type: 'objectId',
      required,
    });
    return this;
  }

  string(fieldName: string, length = 255, required = false): this {
    this.fields.push({
      name: fieldName,
      type: 'string',
      length,
      required,
    });
    return this;
  }

  unique(): this {
    const lastField = this.fields[this.fields.length - 1];
    if (lastField) {
      lastField.unique = true;
      this.index(lastField.name, { unique: true });
    }
    return this;
  }

  text(fieldName: string, required = false): this {
    this.fields.push({
      name: fieldName,
      type: 'string',
      length: 0,
      required,
    });
    return this;
  }

  integer(fieldName: string, required = false): this {
    this.fields.push({
      name: fieldName,
      type: 'int',
      required,
    });
    return this;
  }

  boolean(fieldName: string, required = false): this {
    this.fields.push({
      name: fieldName,
      type: 'bool',
      required,
    });
    return this;
  }

  timestamp(fieldName: string): this {
    this.fields.push({
      name: fieldName,
      type: 'date',
      required: false,
    });
    return this;
  }

  timestamps(): this {
    this.timestamp('created_at');
    this.timestamp('updated_at');
    return this;
  }

  index(fieldName: string | string[], options: Record<string, any> = {}): this {
    const fields: Record<string, 1 | -1> = {};

    if (Array.isArray(fieldName)) {
      fieldName.forEach((name) => {
        fields[name] = 1;
      });
    } else {
      fields[fieldName] = 1;
    }

    this.indexes.push({ fields, options });
    return this;
  }

  getValidator(): object | null {
    if (this.fields.length === 0) {
      return null;
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const field of this.fields) {
      const bsonType = this.toBsonType(field.type);
      properties[field.name] = {
        bsonType,
        description: `Must be a ${bsonType}`,
      };

      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      $jsonSchema: {
        bsonType: 'object',
        required,
        properties,
      },
    };
  }

  private toBsonType(type: string): string {
    switch (type) {
      case 'string':
        return 'string';
      case 'int':
      case 'integer':
        return 'int';
      case 'bool':
      case 'boolean':
        return 'bool';
      case 'date':
      case 'timestamp':
        return 'date';
      case 'objectId':
        return 'objectId';
      default:
        return 'string';
    }
  }
}

export interface FieldDefinition {
  name: string;
  type: string;
  length?: number;
  primary?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  required?: boolean;
}

export class SchemaRunner {
  private schemas: Schema[] = [];

  add(schema: Schema): this {
    this.schemas.push(schema);
    return this;
  }

  async run(): Promise<void> {
    logger.info('Running schema files...');
    for (const schema of this.schemas) {
      await schema.up();
    }
    logger.info('All schemas completed.');
  }

  async rollback(): Promise<void> {
    logger.info('Rolling back schema files...');
    for (let i = this.schemas.length - 1; i >= 0; i--) {
      await this.schemas[i].down();
    }
    logger.info('Rollback completed.');
  }
}
