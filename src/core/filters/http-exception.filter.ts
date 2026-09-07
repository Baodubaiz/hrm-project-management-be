import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    let message = exception.message;
    let errors: any = null;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if (Array.isArray(exceptionResponse.message)) {
        message = 'Validation failed';
        errors = exceptionResponse.message;
      } else if (exceptionResponse.message) {
        message = exceptionResponse.message;
      }
    }

    this.logger.warn(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

