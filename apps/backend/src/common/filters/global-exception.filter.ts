import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveUserId, sanitizePath } from '../http/http-log.utils';
import type { AuthenticatedRequest } from '../http/request-context.types';

type ErrorResponseBody = {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildErrorResponse(exception, status, request);

    this.logger.error(
      JSON.stringify({
        method: request.method,
        path: sanitizePath(request.originalUrl ?? request.url),
        status,
        userId: resolveUserId(request.user),
        errorName: this.getErrorName(exception),
      }),
    );

    response.status(status).json(body);
  }

  private buildErrorResponse(
    exception: unknown,
    status: number,
    request: AuthenticatedRequest,
  ): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          message: exceptionResponse,
          error: exception.name,
          timestamp: new Date().toISOString(),
          path: sanitizePath(request.originalUrl ?? request.url),
        };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObject = exceptionResponse as Record<string, unknown>;
        const message = this.normalizeMessage(responseObject.message);
        const error =
          typeof responseObject.error === 'string'
            ? responseObject.error
            : exception.name;

        return {
          statusCode: status,
          message,
          error,
          timestamp: new Date().toISOString(),
          path: sanitizePath(request.originalUrl ?? request.url),
        };
      }
    }

    return {
      statusCode: status,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: sanitizePath(request.originalUrl ?? request.url),
    };
  }

  private normalizeMessage(message: unknown): string {
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Unexpected error';
  }

  private getErrorName(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.name;
    }

    return 'UnknownError';
  }
}
