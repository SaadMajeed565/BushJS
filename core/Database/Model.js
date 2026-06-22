"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelongsToRelation = exports.HasManyRelation = exports.Model = void 0;
const mongoose_1 = require("mongoose");
const Connection_1 = require("./Connection");
const QueryBuilder_1 = require("./QueryBuilder");
const HttpExceptions_1 = require("../Exceptions/HttpExceptions");
class Model {
    constructor(attributes = {}) {
        const ModelClass = this.constructor;
        if (!ModelClass.model) {
            ModelClass.initialize();
        }
        this.document = new ModelClass.model(attributes);
    }
    static initialize() {
        if (this.fields) {
            const mongooseSchemaDefinition = {};
            for (const [fieldName, fieldDef] of Object.entries(this.fields)) {
                mongooseSchemaDefinition[fieldName] = this.mapFieldToMongoose(fieldDef);
            }
            mongooseSchemaDefinition.created_at = { type: Date, default: Date.now };
            mongooseSchemaDefinition.updated_at = { type: Date, default: Date.now };
            this.schema = new mongoose_1.Schema(mongooseSchemaDefinition, {
                timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
            });
        }
        else if (!this.schema) {
            this.schema = new mongoose_1.Schema({
                created_at: { type: Date, default: Date.now },
                updated_at: { type: Date, default: Date.now }
            }, {
                timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
            });
        }
        const conn = (0, Connection_1.getDefaultConnection)().getConnection();
        if (conn.models[this.collection]) {
            delete conn.models[this.collection];
        }
        this.model = conn.model(this.collection, this.schema);
    }
    static ensureInitialized() {
        if (!this.model) {
            this.initialize();
        }
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
        if (fieldDef.required !== undefined)
            mongooseDef.required = fieldDef.required;
        if (fieldDef.unique !== undefined)
            mongooseDef.unique = fieldDef.unique;
        if (fieldDef.default !== undefined)
            mongooseDef.default = fieldDef.default;
        return mongooseDef;
    }
    static query() {
        this.ensureInitialized();
        return new QueryBuilder_1.QueryBuilder(this.model);
    }
    static async all() {
        return await this.query().get();
    }
    static async find(id) {
        this.ensureInitialized();
        return await this.model.findById(id);
    }
    static async create(attributes) {
        this.ensureInitialized();
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
            throw new HttpExceptions_1.NotFoundException(this.name, typeof id === 'string' ? id : id.toString());
        }
        return result;
    }
    static async update(id, attributes) {
        this.ensureInitialized();
        return await this.model.findByIdAndUpdate(id, attributes, { new: true });
    }
    static async delete(id) {
        this.ensureInitialized();
        return await this.model.findByIdAndDelete(id);
    }
    static async paginate(page = 1, perPage = 15) {
        this.ensureInitialized();
        const skip = (page - 1) * perPage;
        const [data, total] = await Promise.all([
            this.model.find().skip(skip).limit(perPage),
            this.model.countDocuments(),
        ]);
        return {
            data: data,
            total,
            page,
            perPage,
        };
    }
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