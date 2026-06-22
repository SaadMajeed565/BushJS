"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor(model) {
        this.model = model;
        this.conditions = {};
        this.hasConditions = false;
    }
    where(column, value) {
        this.conditions[column] = value;
        this.hasConditions = true;
        return this;
    }
    whereIn(column, values) {
        this.conditions[column] = { $in: values };
        this.hasConditions = true;
        return this;
    }
    whereNotIn(column, values) {
        this.conditions[column] = { $nin: values };
        this.hasConditions = true;
        return this;
    }
    limit(limit) {
        this.limitValue = limit;
        return this;
    }
    skip(skip) {
        this.skipValue = skip;
        return this;
    }
    orderBy(column, direction = 'asc') {
        this.sortValue = { [column]: direction === 'asc' ? 1 : -1 };
        return this;
    }
    async get() {
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
    async first() {
        const results = await this.get();
        return results.length > 0 ? results[0] : null;
    }
    async count() {
        return await this.model.countDocuments(this.conditions);
    }
    async exists() {
        const count = await this.count();
        return count > 0;
    }
    async delete() {
        if (!this.hasConditions) {
            throw new Error('Cannot delete without at least one where clause. Call where() first.');
        }
        return await this.model.deleteMany(this.conditions);
    }
    async update(data) {
        if (!this.hasConditions) {
            throw new Error('Cannot update without at least one where clause. Call where() first.');
        }
        return await this.model.updateMany(this.conditions, data);
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map