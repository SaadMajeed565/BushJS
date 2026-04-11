"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCollection = exports.Resource = exports.ApiResponse = void 0;
class ApiResponse {
    constructor(response) {
        this.response = response;
    }
    success(data, message = 'Success', status = 200) {
        this.response.status(status).json({
            success: true,
            message,
            data,
        });
    }
    error(message = 'Error', status = 400, errors = null) {
        const payload = {
            success: false,
            message,
        };
        if (errors) {
            payload.errors = errors;
        }
        this.response.status(status).json(payload);
    }
    created(data, message = 'Created successfully') {
        this.success(data, message, 201);
    }
    noContent(message = 'No content') {
        this.response.status(204).json({
            success: true,
            message,
        });
    }
    paginate(data, total, page, perPage, message = 'Data retrieved successfully') {
        const totalPages = Math.ceil(total / perPage);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        this.response.json({
            success: true,
            message,
            data,
            pagination: {
                total,
                per_page: perPage,
                current_page: page,
                last_page: totalPages,
                from: (page - 1) * perPage + 1,
                to: Math.min(page * perPage, total),
                has_next: hasNext,
                has_prev: hasPrev,
            },
        });
    }
}
exports.ApiResponse = ApiResponse;
class Resource {
    constructor(resource) {
        this.resource = resource;
    }
    toArray() {
        return this.resource;
    }
}
exports.Resource = Resource;
class ResourceCollection {
    constructor(resources) {
        this.resources = resources;
    }
    toArray() {
        return this.resources.map(resource => {
            if (resource instanceof Resource) {
                return resource.toArray();
            }
            return resource;
        });
    }
}
exports.ResourceCollection = ResourceCollection;
//# sourceMappingURL=ApiResponse.js.map