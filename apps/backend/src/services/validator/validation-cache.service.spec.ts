import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { ValidationCacheService } from './validation-cache.service';

describe('ValidationCacheService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createService = ({
    redis,
    ttl,
  }: {
    redis?: Partial<Redis>;
    ttl?: string;
  } = {}) =>
    new ValidationCacheService(
      {
        get: jest.fn((key: string) =>
          key === 'VALIDATION_CACHE_TTL_SECONDS' ? ttl : undefined,
        ),
      } as unknown as ConfigService,
      {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        ...redis,
      } as unknown as Redis,
    );

  const input = {
    equation: ' 3x + 5 = 14 ',
    studentAnswer: ' 3 ',
    problemType: 'algebra' as const,
  };

  const result = {
    isCorrect: true,
    expected: 3,
    studentAnswer: 3,
    errorType: 'none' as const,
  };

  it('builds stable normalized cache keys', () => {
    const service = createService();

    expect(service.buildCacheKey(input)).toBe(
      'socratix:validation:v1:3x+5=14:3',
    );
  });

  it('returns cached validation results when Redis has valid JSON', async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(JSON.stringify(result)),
    };
    const service = createService({ redis });

    await expect(service.get(input)).resolves.toEqual(result);
    expect(redis.get).toHaveBeenCalledWith(
      'socratix:validation:v1:3x+5=14:3',
    );
  });

  it('deletes malformed cache entries and returns null', async () => {
    const redis = {
      get: jest.fn().mockResolvedValue('{"unexpected":true}'),
      del: jest.fn().mockResolvedValue(1),
    };
    const service = createService({ redis });

    await expect(service.get(input)).resolves.toBeNull();
    expect(redis.del).toHaveBeenCalledWith(
      'socratix:validation:v1:3x+5=14:3',
    );
  });

  it('writes cache entries with configured TTL', async () => {
    const redis = {
      set: jest.fn().mockResolvedValue('OK'),
    };
    const service = createService({ redis, ttl: '7200' });

    await service.set(input, result);

    expect(redis.set).toHaveBeenCalledWith(
      'socratix:validation:v1:3x+5=14:3',
      JSON.stringify(result),
      'EX',
      7200,
    );
  });

  it('falls back to the default TTL when config is invalid', async () => {
    const redis = {
      set: jest.fn().mockResolvedValue('OK'),
    };
    const service = createService({ redis, ttl: 'not-a-number' });

    await service.set(input, result);

    expect(redis.set).toHaveBeenCalledWith(
      'socratix:validation:v1:3x+5=14:3',
      JSON.stringify(result),
      'EX',
      86400,
    );
  });

  it('swallows Redis errors and logs a warning', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const redis = {
      get: jest.fn().mockRejectedValue(new Error('redis unavailable')),
    };
    const service = createService({ redis });

    await expect(service.get(input)).resolves.toBeNull();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
