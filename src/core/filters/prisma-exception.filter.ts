import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Database request error';
    let errors: any = null;

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        message = `Unique constraint failed on field(s): ${target.join(', ')}`;
        errors = { target };
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message =
          (exception.meta?.cause as string) ||
          'Target record for operation was not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        message = `Foreign key constraint failed on field: ${field || 'unknown'}`;
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'The change you are trying to make would violate a required relation.';
        break;
      }
      default: {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Unhandled Prisma database error (code: ${exception.code})`;
        break;
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Prisma Error ${exception.code}: ${message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      code: exception.code,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

