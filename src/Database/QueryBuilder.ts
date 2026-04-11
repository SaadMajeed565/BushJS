import { Model as MongooseModel, Document, FilterQuery } from 'mongoose';

export class QueryBuilder {
  private conditions: FilterQuery<any> = {};
  private limitValue?: number;
  private skipValue?: number;
  private sortValue?: Record<string, 1 | -1>;

  constructor(private model: MongooseModel<any>) {}

  where(column: string, value: any): this {
    this.conditions[column] = value;
    return this;
  }

  whereIn(column: string, values: any[]): this {
    this.conditions[column] = { $in: values };
    return this;
  }

  whereNotIn(column: string, values: any[]): this {
    this.conditions[column] = { $nin: values };
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

  async get(): Promise<Document[]> {
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

    return await query.exec();
  }

  async first(): Promise<Document | null> {
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

  async delete(): Promise<any> {
    return await this.model.deleteMany(this.conditions);
  }

  async update(data: Record<string, any>): Promise<any> {
    return await this.model.updateMany(this.conditions, data);
  }
}
