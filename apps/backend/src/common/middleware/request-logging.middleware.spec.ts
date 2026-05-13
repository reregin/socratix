import { Logger } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  const originalDateNow = Date.now;

  afterEach(() => {
    Date.now = originalDateNow;
    jest.restoreAllMocks();
  });

  it('logs method, path, status, duration, and user id without request body data', () => {
    const middleware = new RequestLoggingMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    let finishHandler: (() => void) | undefined;
    const req = {
      method: 'POST',
      originalUrl: '/chat?message=secret',
      user: { sub: 'user-123', email: 'student@example.com' },
      body: { prompt: 'my private homework answer' },
    };
    const res = {
      statusCode: 201,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(100).mockReturnValueOnce(145);

    middleware.use(req as never, res, next);
    finishHandler?.();

    expect(next).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        method: 'POST',
        path: '/chat',
        status: 201,
        durationMs: 45,
        userId: 'user-123',
      }),
    );
    expect(logSpy.mock.calls[0][0]).not.toContain('message=secret');
    expect(logSpy.mock.calls[0][0]).not.toContain('private homework');
    expect(logSpy.mock.calls[0][0]).not.toContain('student@example.com');
  });

  it('logs anonymous when the request has no authenticated user', () => {
    const middleware = new RequestLoggingMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    let finishHandler: (() => void) | undefined;
    const req = {
      method: 'GET',
      url: '/',
    };
    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as unknown as Response;

    jest.spyOn(Date, 'now').mockReturnValueOnce(20).mockReturnValueOnce(25);

    middleware.use(req as never, res, jest.fn() as NextFunction);
    finishHandler?.();

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        method: 'GET',
        path: '/',
        status: 200,
        durationMs: 5,
        userId: 'anonymous',
      }),
    );
  });
});
