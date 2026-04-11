import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { QueryBuilder } from './QueryBuilder';
export interface IModel extends Document {
    _id: mongoose.Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
}
export declare abstract class Model {
    static collection: string;
    static schema: Schema | string | [string, Record<string, any>];
    static fields?: [string, Record<string, any>] | Record<string, any>;
    static model: MongooseModel<any>;
    protected document: Document;
    constructor(attributes?: Record<string, any>);
    static initialize(): void;
    private static mapFieldToMongoose;
    static query<T extends typeof Model>(this: T): QueryBuilder;
    static all<T extends typeof Model>(this: T): Promise<Document[]>;
    static find<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document | null>;
    static create<T extends typeof Model>(this: T, attributes: Record<string, any>): Promise<Document>;
    static first<T extends typeof Model>(this: T): Promise<Document | null>;
    static where<T extends typeof Model>(this: T, column: string, value: any): QueryBuilder;
    static findOrFail<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document>;
    static update<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId, attributes: Record<string, any>): Promise<Document | null>;
    static delete<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<Document | null>;
    static paginate<T extends typeof Model>(this: T, page?: number, perPage?: number): Promise<{
        data: Document[];
        total: number;
        page: number;
        perPage: number;
    }>;
    static hasMany<T extends typeof Model>(this: T, relatedModel: T, foreignKey?: string, localKey?: string): HasManyRelation;
    static belongsTo<T extends typeof Model>(this: T, relatedModel: T, foreignKey?: string, ownerKey?: string): BelongsToRelation;
    get(key: string): any;
    set(key: string, value: any): void;
    save(): Promise<Document>;
    toJSON(): Record<string, any>;
    toObject(): Record<string, any>;
}
export declare class HasManyRelation {
    private parentModel;
    private relatedModel;
    private foreignKey?;
    private localKey;
    constructor(parentModel: typeof Model, relatedModel: typeof Model, foreignKey?: string | undefined, localKey?: string);
    get(parentId: any): Promise<Document[]>;
}
export declare class BelongsToRelation {
    private parentModel;
    private relatedModel;
    private foreignKey?;
    private ownerKey;
    constructor(parentModel: typeof Model, relatedModel: typeof Model, foreignKey?: string | undefined, ownerKey?: string);
    get(foreignKeyValue: any): Promise<Document | null>;
}
//# sourceMappingURL=Model.d.ts.map