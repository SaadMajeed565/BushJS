import { Model as MongooseModel, Document, FilterQuery } from 'mongoose';

export class QueryBuilder<T = any> {
  private conditions: FilterQuery<any> = {};
  private hasConditions = false;
  private limitValue?: number;
  private skipValue?: number;
  private sortValue?: Record<string, 1 | -1>;

  constructor(private model: MongooseModel<any>) {}

  where(column: string, value: unknown): this {
    this.conditions[column] = value;
    this.hasConditions = true;
    return this;
  }

  whereIn(column: string, values: unknown[]): this {
    this.conditions[column] = { $in: values };
    this.hasConditions = true;
    return this;
  }

  whereNotIn(column: string, values: unknown[]): this {
    this.conditions[column] = { $nin: values };
    this.hasConditions = true;
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  skip(skip: number): this {
    this.skipValue = skip;
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortValue = { [column]: direction === 'asc' ? 1 : -1 };
    return this;
  }

  async get(): Promise<T[]> {
    let query = this.model.find(this.conditions);

    if (this.sortValue) {
      query = query.sort(this.sortValue);
    }

    if (this.skipValue) {
      query = query.skip(this.skipValue);
    }

    if (this.limitValue) {
      query = query.limit(this.limitValue);
    }

    return await query.exec() as T[];
  }

  async first(): Promise<T | null> {
    const results = await this.get();
    return results.length > 0 ? results[0] : null;
  }

  async count(): Promise<number> {
    return await this.model.countDocuments(this.conditions);
  }

  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  async delete(): Promise<unknown> {
    if (!this.hasConditions) {
      throw new Error('Cannot delete without at least one where clause. Call where() first.');
    }
    return await this.model.deleteMany(this.conditions);
  }

  async update(data: Record<string, unknown>): Promise<unknown> {
    if (!this.hasConditions) {
      throw new Error('Cannot update without at least one where clause. Call where() first.');
    }
    return await this.model.updateMany(this.conditions, data);
  }
}
