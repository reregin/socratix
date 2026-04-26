import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { redisProvider } from './redis.provider.js';
import { REDIS_CLIENT } from './redis.constants.js';
import { RedisLifecycleService } from './redis-lifecycle.service.js';

@Module({
  imports: [],
  providers: [PrismaService, redisProvider, RedisLifecycleService],
  exports: [PrismaService, REDIS_CLIENT],
})
export class DbModule {}
