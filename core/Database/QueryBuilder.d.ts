import { Model as MongooseModel, Document } from 'mongoose';
export declare class QueryBuilder {
    private model;
    private conditions;
    private limitValue?;
    private skipValue?;
    private sortValue?;
    constructor(model: MongooseModel<any>);
    where(column: string, value: any): this;
    whereIn(column: string, values: any[]): this;
    whereNotIn(column: string, values: any[]): this;
    limit(limit: number): this;
    skip(skip: number): this;
    orderBy(column: string, direction?: 'asc' | 'desc'): this;
    get(): Promise<Document[]>;
    first(): Promise<Document | null>;
    count(): Promise<number>;
    exists(): Promise<boolean>;
    delete(): Promise<any>;
    update(data: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=QueryBuilder.d.ts.map