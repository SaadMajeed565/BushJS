export interface Schema {
    up(): Promise<void> | void;
    down(): Promise<void> | void;
}
export interface IndexDefinition {
    fields: Record<string, 1 | -1>;
    options?: Record<string, any>;
}
export declare abstract class BaseSchema implements Schema {
    abstract up(): Promise<void> | void;
    abstract down(): Promise<void> | void;
    protected createTable(tableName: string, callback: (schema: SchemaBuilder) => void): Promise<void>;
    protected createCollection(collectionName: string, callback: (schema: SchemaBuilder) => void): Promise<void>;
    protected createIndexes(collectionName: string, indexes: IndexDefinition[]): Promise<void>;
    protected dropTable(tableName: string): Promise<void>;
    protected dropCollection(collectionName: string): Promise<void>;
}
export declare class SchemaBuilder {
    collectionName: string;
    fields: FieldDefinition[];
    indexes: IndexDefinition[];
    constructor(collectionName: string);
    id(fieldName?: string): this;
    string(fieldName: string, length?: number, required?: boolean): this;
    unique(): this;
    text(fieldName: string, required?: boolean): this;
    integer(fieldName: string, required?: boolean): this;
    boolean(fieldName: string, required?: boolean): this;
    timestamp(fieldName: string): this;
    timestamps(): this;
    index(fieldName: string | string[], options?: Record<string, any>): this;
    getValidator(): object | null;
    private toBsonType;
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
export declare class SchemaRunner {
    private schemas;
    add(schema: Schema): this;
    run(): Promise<void>;
    rollback(): Promise<void>;
}
//# sourceMappingURL=Schema.d.ts.map