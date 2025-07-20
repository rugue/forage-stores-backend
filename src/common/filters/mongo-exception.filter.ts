import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    
    // Handle specific MongoDB error codes
    switch (exception.code) {
      case 11000: // Duplicate key
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry. This record already exists.';
        break;
      default:
        message = 'Database operation failed';
    }
    
    const errorObj = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: exception.name,
    };

    this.logger.error(
      `${request.method} ${request.url} - MongoDB Error: ${exception.code}`,
      exception.stack,
    );

    response.status(status).json(errorObj);
  }
}
