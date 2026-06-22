import { Model as MongooseModel } from 'mongoose';
export declare class QueryBuilder<T = any> {
    private model;
    private conditions;
    private hasConditions;
    private limitValue?;
    private skipValue?;
    private sortValue?;
    constructor(model: MongooseModel<any>);
    where(column: string, value: unknown): this;
    whereIn(column: string, values: unknown[]): this;
    whereNotIn(column: string, values: unknown[]): this;
    limit(limit: number): this;
    skip(skip: number): this;
    orderBy(column: string, direction?: 'asc' | 'desc'): this;
    get(): Promise<T[]>;
    first(): Promise<T | null>;
    count(): Promise<number>;
    exists(): Promise<boolean>;
    delete(): Promise<unknown>;
    update(data: Record<string, unknown>): Promise<unknown>;
}
//# sourceMappingURL=QueryBuilder.d.ts.map