"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionHandler = void 0;
const HttpExceptions_1 = require("./HttpExceptions");
class ExceptionHandler {
    handle(error, request, response) {
        if (error instanceof HttpExceptions_1.HttpException) {
            const statusCode = error.statusCode;
            const message = error.message;
            if (error instanceof HttpExceptions_1.ValidationFailedException) {
                response.status(statusCode).json({
                    message,
                    errors: error.errors,
                });
            }
            else {
                response.status(statusCode).json({
                    message,
                });
            }
            return;
        }
        // Default error handling
        console.error(error);
        response.status(500).json({
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
        });
    }
}
exports.ExceptionHandler = ExceptionHandler;
//# sourceMappingURL=ExceptionHandler.js.map