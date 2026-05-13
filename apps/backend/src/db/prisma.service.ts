import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Create with a dummy adapter so NestJS DI doesn't crash.
      // DB operations will fail at runtime but the server can still boot.
      const pool = new pg.Pool({ connectionString: 'postgresql://localhost:5432/dummy' });
      const adapter = new PrismaPg(pool);
      super({ adapter });
      return;
    }
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn('DATABASE_URL not set or DB unreachable — Prisma is DISABLED. Set it in .env for full functionality.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Already disconnected or never connected
    }
  }
}
