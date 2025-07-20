import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: ValidationError | ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Handle both single error and array of errors
    const errors = Array.isArray(exception) ? exception : [exception];
    
    const validationErrors = this.formatValidationErrors(errors);
    
    const errorObj = {
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      errors: validationErrors,
    };

    this.logger.error(
      `${request.method} ${request.url} - Validation Error`,
      JSON.stringify(validationErrors),
    );

    response.status(HttpStatus.BAD_REQUEST).json(errorObj);
  }

  private formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    errors.forEach(error => {
      if (error.constraints) {
        result[error.property] = Object.values(error.constraints);
      }
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatValidationErrors(error.children);
        
        Object.keys(childErrors).forEach(key => {
          result[`${error.property}.${key}`] = childErrors[key];
        });
      }
    });
    
    return result;
  }
}
