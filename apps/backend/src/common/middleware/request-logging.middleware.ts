import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { resolveUserId, sanitizePath } from '../http/http-log.utils';
import type { AuthenticatedRequest } from '../http/request-context.types';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const logPayload = {
        method: req.method,
        path: sanitizePath(req.originalUrl ?? req.url),
        status: res.statusCode,
        durationMs,
        userId: resolveUserId(req.user),
      };

      this.logger.log(JSON.stringify(logPayload));
    });

    next();
  }
}
