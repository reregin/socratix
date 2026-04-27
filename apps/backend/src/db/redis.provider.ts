import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants.js';

const REDIS_URL_KEY = 'REDIS_URL';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('RedisProvider');
    const redisUrl = configService.get<string>(REDIS_URL_KEY);

    if (!redisUrl) {
      logger.warn(`${REDIS_URL_KEY} not set — Redis cache is DISABLED. Set it in .env for full functionality.`);
      return null;
    }

    return new Redis(redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 2,
    });
  },
};

