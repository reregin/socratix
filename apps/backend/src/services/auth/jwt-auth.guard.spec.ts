import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const secret = 'test-nextauth-secret';

  const createExecutionContext = (
    authorization?: string,
    request: Record<string, unknown> = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => {
          request.headers = authorization ? { authorization } : {};
          return request;
        },
      }),
    }) as ExecutionContext;

  const createGuard = (configuredSecret?: string) =>
    new JwtAuthGuard({
      get: jest.fn((key: string) => {
        if (key === 'NEXTAUTH_SECRET') {
          return configuredSecret;
        }

        return undefined;
      }),
    } as unknown as ConfigService);

  it('throws when the authorization header is missing', () => {
    const guard = createGuard(secret);

    expect(() => guard.canActivate(createExecutionContext())).toThrow(
      new UnauthorizedException('Authorization header is missing'),
    );
  });

  it('throws when the authorization header is not a bearer token', () => {
    const guard = createGuard(secret);

    expect(() =>
      guard.canActivate(createExecutionContext('Basic not-a-jwt')),
    ).toThrow(
      new UnauthorizedException(
        'Authorization header must use Bearer token format',
      ),
    );
  });

  it('throws when the NextAuth secret is not configured', () => {
    const guard = createGuard(undefined);
    const token = jwt.sign({ sub: 'user-123' }, secret, { expiresIn: '1h' });

    expect(() =>
      guard.canActivate(createExecutionContext(`Bearer ${token}`)),
    ).toThrow(new UnauthorizedException('JWT secret is not configured'));
  });

  it('throws when the token has expired', () => {
    const guard = createGuard(secret);
    const token = jwt.sign({ sub: 'user-123' }, secret, { expiresIn: -1 });

    expect(() =>
      guard.canActivate(createExecutionContext(`Bearer ${token}`)),
    ).toThrow(new UnauthorizedException('Token has expired'));
  });

  it('throws when the token signature is invalid', () => {
    const guard = createGuard(secret);
    const token = jwt.sign({ sub: 'user-123' }, 'different-secret', {
      expiresIn: '1h',
    });

    expect(() =>
      guard.canActivate(createExecutionContext(`Bearer ${token}`)),
    ).toThrow(new UnauthorizedException('Invalid token'));
  });

  it('attaches the decoded payload to request.user for valid tokens', () => {
    const guard = createGuard(secret);
    const token = jwt.sign({ sub: 'user-123', email: 'student@example.com' }, secret, {
      expiresIn: '1h',
    });
    const request: Record<string, unknown> = {};

    expect(
      guard.canActivate(createExecutionContext(`Bearer ${token}`, request)),
    ).toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({
        sub: 'user-123',
        email: 'student@example.com',
      }),
    );
  });
});
