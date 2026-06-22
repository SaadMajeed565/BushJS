import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { QueryBuilder } from './QueryBuilder';
type FieldDef = {
    type: 'string' | 'int' | 'integer' | 'bool' | 'boolean' | 'date' | 'objectid' | 'objectId';
    required?: boolean;
    unique?: boolean;
    default?: unknown;
};
type InferField<T> = T extends {
    type: 'string';
} ? string : T extends {
    type: 'int' | 'integer';
} ? number : T extends {
    type: 'boolean' | 'bool';
} ? boolean : T extends {
    type: 'date';
} ? Date : T extends {
    type: 'objectid' | 'objectId';
} ? string : unknown;
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
export declare abstract class Model {
    static collection: string;
    static schema?: Schema;
    static fields?: Record<string, FieldDef>;
    static model: MongooseModel<any>;
    protected document: Document;
    constructor(attributes?: Record<string, unknown>);
    static initialize(): void;
    protected static ensureInitialized(this: typeof Model): void;
    private static mapFieldToMongoose;
    static query<T extends typeof Model>(this: T): QueryBuilder<InferDocument<T['fields']>>;
    static all<T extends typeof Model>(this: T): Promise<InferDocument<T['fields']>[]>;
    static find<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']> | null>;
    static create<T extends typeof Model>(this: T, attributes: Partial<InferDocument<T['fields']>>): Promise<InferDocument<T['fields']>>;
    static first<T extends typeof Model>(this: T): Promise<InferDocument<T['fields']> | null>;
    static where<T extends typeof Model>(this: T, column: string, value: unknown): QueryBuilder<InferDocument<T['fields']>>;
    static findOrFail<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']>>;
    static update<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId, attributes: Partial<InferDocument<T['fields']>>): Promise<InferDocument<T['fields']> | null>;
    static delete<T extends typeof Model>(this: T, id: string | mongoose.Types.ObjectId): Promise<InferDocument<T['fields']> | null>;
    static paginate<T extends typeof Model>(this: T, page?: number, perPage?: number): Promise<PaginatedResult<InferDocument<T['fields']>>>;
    static hasMany<T extends typeof Model>(this: T, relatedModel: T, foreignKey?: string, localKey?: string): HasManyRelation;
    static belongsTo<T extends typeof Model>(this: T, relatedModel: T, foreignKey?: string, ownerKey?: string): BelongsToRelation;
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    save(): Promise<Document>;
    toJSON(): Record<string, unknown>;
    toObject(): Record<string, unknown>;
}
export declare class HasManyRelation {
    private parentModel;
    private relatedModel;
    private foreignKey?;
    private localKey;
    constructor(parentModel: typeof Model, relatedModel: typeof Model, foreignKey?: string | undefined, localKey?: string);
    get(parentId: unknown): Promise<Document[]>;
}
export declare class BelongsToRelation {
    private parentModel;
    private relatedModel;
    private foreignKey?;
    private ownerKey;
    constructor(parentModel: typeof Model, relatedModel: typeof Model, foreignKey?: string | undefined, ownerKey?: string);
    get(foreignKeyValue: unknown): Promise<Document | null>;
}
export {};
//# sourceMappingURL=Model.d.ts.map