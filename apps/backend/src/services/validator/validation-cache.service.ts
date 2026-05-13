import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../db/redis.constants.js';
import {
  ValidationInput,
  ValidationResult,
  ValidationResultSchema,
} from './validator.schema.js';

const DEFAULT_VALIDATION_CACHE_TTL_SECONDS = 86400;

@Injectable()
export class ValidationCacheService {
  private readonly logger = new Logger(ValidationCacheService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async get(input: ValidationInput): Promise<ValidationResult | null> {
    const cacheKey = this.buildCacheKey(input);

    try {
      const raw = await this.redis.get(cacheKey);

      if (!raw) {
        return null;
      }

      const parsed = ValidationResultSchema.safeParse(JSON.parse(raw));

      if (!parsed.success) {
        await this.redis.del(cacheKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      this.logger.warn(
        `Redis validation cache read failed for key "${cacheKey}".`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  async set(input: ValidationInput, result: ValidationResult): Promise<void> {
    const cacheKey = this.buildCacheKey(input);

    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        this.getTtlSeconds(),
      );
    } catch (error) {
      this.logger.warn(
        `Redis validation cache write failed for key "${cacheKey}".`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  buildCacheKey(input: ValidationInput): string {
    return [
      'socratix',
      'validation',
      'v1',
      `${this.normalizeEquation(input.equation)}:${this.normalizeAnswer(input.studentAnswer)}`,
    ].join(':');
  }

  private normalizeEquation(equation: string): string {
    return equation.trim().toLowerCase().replace(/\s+/g, '');
  }

  private normalizeAnswer(answer: number | string): string {
    return String(answer).trim().toLowerCase().replace(/\s+/g, '');
  }

  private getTtlSeconds(): number {
    const configuredTtl = Number(
      this.configService.get<string>('VALIDATION_CACHE_TTL_SECONDS'),
    );

    if (Number.isFinite(configuredTtl) && configuredTtl > 0) {
      return configuredTtl;
    }

    return DEFAULT_VALIDATION_CACHE_TTL_SECONDS;
  }
}

