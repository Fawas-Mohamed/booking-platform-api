import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponseBody {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
  path: string;
  timestamp: string;
}

/**
 * Catches every exception thrown anywhere in the application and
 * normalizes it into a single, predictable JSON error shape:
 *
 * {
 *   "success": false,
 *   "message": "Service not found",
 *   "statusCode": 404,
 *   "path": "/services/123",
 *   "timestamp": "2026-07-12T10:00:00.000Z"
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.resolveException(exception);

    const body: ErrorResponseBody = {
      success: false,
      message,
      ...(errors ? { errors } : {}),
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}: ${message}`);
    }

    response.status(statusCode).json(body);
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[];
  } {
    // Standard Nest HTTP exceptions (BadRequestException, NotFoundException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode: status, message: response };
      }

      const responseObj = response as { message?: string | string[]; error?: string };
      const rawMessage = responseObj.message ?? exception.message;

      // class-validator throws an array of messages via BadRequestException
      if (Array.isArray(rawMessage)) {
        return {
          statusCode: status,
          message: 'Validation failed',
          errors: rawMessage,
        };
      }

      return { statusCode: status, message: rawMessage };
    }

    // Known Prisma errors mapped to sensible HTTP statuses
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    // Fallback: unexpected/unknown error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with this value already exists',
        };
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Requested record was not found' };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference to a related record',
        };
      default:
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
