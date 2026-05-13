import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createHost = (
    request: Record<string, unknown>,
    response: {
      status: jest.Mock;
      json: jest.Mock;
    },
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as ArgumentsHost;

  it('returns a consistent JSON shape for HttpException errors', () => {
    const filter = new GlobalExceptionFilter();
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      method: 'POST',
      originalUrl: '/chat?message=secret',
      user: { sub: 'user-123', email: 'student@example.com' },
    };

    filter.catch(
      new BadRequestException('Invalid prompt format'),
      createHost(request, response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid prompt format',
        error: 'Bad Request',
        path: '/chat',
      }),
    );
    expect(response.json.mock.calls[0][0].timestamp).toEqual(expect.any(String));
    expect(loggerSpy).toHaveBeenCalledWith(
      JSON.stringify({
        method: 'POST',
        path: '/chat',
        status: 400,
        userId: 'user-123',
        errorName: 'BadRequestException',
      }),
    );
    expect(loggerSpy.mock.calls[0][0]).not.toContain('message=secret');
    expect(loggerSpy.mock.calls[0][0]).not.toContain('student@example.com');
  });

  it('hides internal error details behind a stable 500 response', () => {
    const filter = new GlobalExceptionFilter();
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      method: 'GET',
      url: '/health',
    };

    filter.catch(
      new Error('database connection failed with secret details'),
      createHost(request, response),
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/health',
      }),
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      JSON.stringify({
        method: 'GET',
        path: '/health',
        status: 500,
        userId: 'anonymous',
        errorName: 'Error',
      }),
    );
    expect(response.json.mock.calls[0][0].message).not.toContain('secret details');
  });
});
