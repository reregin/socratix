import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants.js';

const REDIS_URL_KEY = 'REDIS_URL';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>(REDIS_URL_KEY);

    if (!redisUrl) {
      throw new Error(`${REDIS_URL_KEY} environment variable is required`);
    }

    return new Redis(redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 2,
    });
  },
};

