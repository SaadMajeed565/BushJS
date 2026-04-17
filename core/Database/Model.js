"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelongsToRelation = exports.HasManyRelation = exports.Model = void 0;
const mongoose_1 = require("mongoose");
const Connection_1 = require("./Connection");
const QueryBuilder_1 = require("./QueryBuilder");
class Model {
    constructor(attributes = {}) {
        const ModelClass = this.constructor;
        if (!ModelClass.model) {
            ModelClass.initialize();
        }
        this.document = new ModelClass.model(attributes);
    }
    static initialize() {
        if (!this.schema && !this.fields) {
            this.schema = new mongoose_1.Schema({
                created_at: { type: Date, default: Date.now },
                updated_at: { type: Date, default: Date.now }
            }, {
                timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
            });
        }
        else if (Array.isArray(this.fields) && this.fields.length === 2 && typeof this.fields[0] === 'string' && typeof this.fields[1] === 'object') {
            // Handle new array format: [schemaName, fields]
            const [schemaName, fieldDefs] = this.fields;
            const mongooseSchemaDefinition = {};
            for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
                mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
            }
            mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
            mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
            this.schema = new mongoose_1.Schema(mongooseSchemaDefinition, {
                timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
            });
        }
        else if (this.schema instanceof mongoose_1.Schema) {
            // Already a Mongoose schema - do nothing
        }
        else if (Array.isArray(this.schema) && this.schema.length === 2) {
            // Handle legacy array format on schema property
            const [schemaName, fieldDefs] = this.schema;
            if (typeof schemaName === 'string' && typeof fieldDefs === 'object') {
                const mongooseSchemaDefinition = {};
                for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
                    mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
                }
                mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
                mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
                this.schema = new mongoose_1.Schema(mongooseSchemaDefinition, {
                    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
                });
            }
            else {
                throw new Error(`Invalid schema array format in model ${this.constructor.name}`);
            }
        }
        else if (typeof this.schema === 'string') {
            // Autodiscover schema class
            const schemaName = this.schema;
            try {
                // Use fields from the model class itself
                const ModelClass = this.constructor;
                if (ModelClass.fields && typeof ModelClass.fields === 'object' && !Array.isArray(ModelClass.fields)) {
                    const mongooseSchemaDefinition = {};
                    for (const [fieldName, fieldDef] of Object.entries(ModelClass.fields)) {
                        mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
                    }
                    mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
                    mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
                    this.schema = new mongoose_1.Schema(mongooseSchemaDefinition, {
                        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
                    });
                }
                else {
                    throw new Error(`Model class '${this.constructor.name}' missing static fields.`);
                }
            }
            catch (error) {
                throw new Error(`Failed to load schema '${schemaName}': ${error.message}`);
            }
        }
        this.model = Connection_1.connection.getConnection().model(this.collection, this.schema);
    }
    static mapFieldToMongoose(fieldDef) {
        const mongooseDef = {};
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
                mongooseDef.type = mongoose_1.Schema.Types.ObjectId;
                break;
            default:
                mongooseDef.type = String;
        }
        if (fieldDef.required)
            mongooseDef.required = true;
        if (fieldDef.unique)
            mongooseDef.unique = true;
        return mongooseDef;
    }
    static query() {
        return new QueryBuilder_1.QueryBuilder(this.model);
    }
    static async all() {
        return await this.query().get();
    }
    static async find(id) {
        return await this.model.findById(id);
    }
    static async create(attributes) {
        return await this.model.create(attributes);
    }
    static async first() {
        return await this.query().first();
    }
    static where(column, value) {
        return this.query().where(column, value);
    }
    static async findOrFail(id) {
        const result = await this.find(id);
        if (!result) {
            throw new Error(`${this.name} not found`);
        }
        return result;
    }
    static async update(id, attributes) {
        return await this.model.findByIdAndUpdate(id, attributes, { new: true });
    }
    static async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }
    static async paginate(page = 1, perPage = 15) {
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
    static hasMany(relatedModel, foreignKey, localKey = '_id') {
        return new HasManyRelation(this, relatedModel, foreignKey, localKey);
    }
    static belongsTo(relatedModel, foreignKey, ownerKey = '_id') {
        return new BelongsToRelation(this, relatedModel, foreignKey, ownerKey);
    }
    get(key) {
        return this.document.get(key);
    }
    set(key, value) {
        this.document.set(key, value);
    }
    async save() {
        return await this.document.save();
    }
    toJSON() {
        return this.document.toJSON();
    }
    toObject() {
        return this.document.toObject();
    }
}
exports.Model = Model;
Model.collection = '';
// Relationship classes
class HasManyRelation {
    constructor(parentModel, relatedModel, foreignKey, localKey = '_id') {
        this.parentModel = parentModel;
        this.relatedModel = relatedModel;
        this.foreignKey = foreignKey;
        this.localKey = localKey;
    }
    async get(parentId) {
        const fk = this.foreignKey || `${this.parentModel.collection.slice(0, -1)}_id`;
        return await this.relatedModel.model.find({ [fk]: parentId });
    }
}
exports.HasManyRelation = HasManyRelation;
class BelongsToRelation {
    constructor(parentModel, relatedModel, foreignKey, ownerKey = '_id') {
        this.parentModel = parentModel;
        this.relatedModel = relatedModel;
        this.foreignKey = foreignKey;
        this.ownerKey = ownerKey;
    }
    async get(foreignKeyValue) {
        return await this.relatedModel.model.findById(foreignKeyValue);
    }
}
exports.BelongsToRelation = BelongsToRelation;
//# sourceMappingURL=Model.js.map