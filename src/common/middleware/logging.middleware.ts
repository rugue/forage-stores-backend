import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log the request when it starts
    this.logger.log(
      `[REQUEST] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Log response when finished
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      if (statusCode >= 400) {
        this.logger.warn(
          `[RESPONSE] ${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms`,
        );
      } else {
        this.logger.log(
          `[RESPONSE] ${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms`,
        );
      }
    });

    next();
  }
}
