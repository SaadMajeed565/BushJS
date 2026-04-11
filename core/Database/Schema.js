"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRunner = exports.SchemaBuilder = exports.BaseSchema = void 0;
const Connection_1 = require("./Connection");
class BaseSchema {
    async createTable(tableName, callback) {
        await this.createCollection(tableName, callback);
    }
    async createCollection(collectionName, callback) {
        const schema = new SchemaBuilder(collectionName);
        callback(schema);
        const db = Connection_1.connection.getConnection().connection.db;
        if (!db) {
            throw new Error('MongoDB connection is not established');
        }
        const options = {};
        const validator = schema.getValidator();
        if (validator) {
            options.validator = validator;
        }
        try {
            await db.createCollection(collectionName, options);
            console.log(`Created collection: ${collectionName}`);
        }
        catch (error) {
            if (error.codeName === 'NamespaceExists' || error.code === 48) {
                console.log(`Collection already exists: ${collectionName}`);
            }
            else {
                throw error;
            }
        }
        if (schema.indexes.length > 0) {
            await this.createIndexes(collectionName, schema.indexes);
        }
    }
    async createIndexes(collectionName, indexes) {
        const db = Connection_1.connection.getConnection().connection.db;
        if (!db) {
            throw new Error('MongoDB connection is not established');
        }
        const collection = db.collection(collectionName);
        for (const index of indexes) {
            await collection.createIndex(index.fields, index.options);
            console.log(`Created index for ${collectionName}:`, index.fields, index.options);
        }
    }
    async dropTable(tableName) {
        await this.dropCollection(tableName);
    }
    async dropCollection(collectionName) {
        const db = Connection_1.connection.getConnection().connection.db;
        if (!db) {
            throw new Error('MongoDB connection is not established');
        }
        const exists = await db.listCollections({ name: collectionName }).hasNext();
        if (exists) {
            await db.dropCollection(collectionName);
            console.log(`Dropped collection: ${collectionName}`);
        }
        else {
            console.log(`Collection does not exist: ${collectionName}`);
        }
    }
}
exports.BaseSchema = BaseSchema;
class SchemaBuilder {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.fields = [];
        this.indexes = [];
    }
    id(fieldName = '_id') {
        this.fields.push({
            name: fieldName,
            type: 'objectId',
            primary: true,
            required: true,
        });
        return this;
    }
    string(fieldName, length = 255, required = false) {
        this.fields.push({
            name: fieldName,
            type: 'string',
            length,
            required,
        });
        return this;
    }
    unique() {
        const lastField = this.fields[this.fields.length - 1];
        if (lastField) {
            lastField.unique = true;
            this.index(lastField.name, { unique: true });
        }
        return this;
    }
    text(fieldName, required = false) {
        this.fields.push({
            name: fieldName,
            type: 'string',
            length: 0,
            required,
        });
        return this;
    }
    integer(fieldName, required = false) {
        this.fields.push({
            name: fieldName,
            type: 'int',
            required,
        });
        return this;
    }
    boolean(fieldName, required = false) {
        this.fields.push({
            name: fieldName,
            type: 'bool',
            required,
        });
        return this;
    }
    timestamp(fieldName) {
        this.fields.push({
            name: fieldName,
            type: 'date',
            required: false,
        });
        return this;
    }
    timestamps() {
        this.timestamp('created_at');
        this.timestamp('updated_at');
        return this;
    }
    index(fieldName, options = {}) {
        const fields = {};
        if (Array.isArray(fieldName)) {
            fieldName.forEach((name) => {
                fields[name] = 1;
            });
        }
        else {
            fields[fieldName] = 1;
        }
        this.indexes.push({ fields, options });
        return this;
    }
    getValidator() {
        if (this.fields.length === 0) {
            return null;
        }
        const properties = {};
        const required = [];
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
    toBsonType(type) {
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
exports.SchemaBuilder = SchemaBuilder;
class SchemaRunner {
    constructor() {
        this.schemas = [];
    }
    add(schema) {
        this.schemas.push(schema);
        return this;
    }
    async run() {
        console.log('Running schema files...');
        for (const schema of this.schemas) {
            await schema.up();
        }
        console.log('All schemas completed.');
    }
    async rollback() {
        console.log('Rolling back schema files...');
        for (let i = this.schemas.length - 1; i >= 0; i--) {
            await this.schemas[i].down();
        }
        console.log('Rollback completed.');
    }
}
exports.SchemaRunner = SchemaRunner;
//# sourceMappingURL=Schema.js.map