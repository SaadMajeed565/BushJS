import { Request } from '../Http/Request';
import { Response } from '../Http/Response';
import { HttpException, ValidationFailedException } from './HttpExceptions';

export class ExceptionHandler {
  handle(error: Error, request: Request, response: Response): void {
    if (error instanceof HttpException) {
      const statusCode = error.statusCode;
      const message = error.message;

      if (error instanceof ValidationFailedException) {
        response.status(statusCode).json({
          message,
          errors: error.errors,
        });
      } else {
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