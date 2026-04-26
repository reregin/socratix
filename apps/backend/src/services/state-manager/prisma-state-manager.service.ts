import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { IStateManager } from './state-manager.interface.js';
import { SessionState, SessionStateSchema } from './state.schema.js';
import { PrismaService } from '../../db/prisma.service.js';
import { REDIS_CLIENT } from '../../db/redis.constants.js';

@Injectable()
export class PrismaStateManagerService implements IStateManager {
  private static readonly SESSION_CACHE_TTL_SECONDS = 300;
  private readonly logger = new Logger(PrismaStateManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getState(uid: string): Promise<SessionState | null> {
    return this.getSession(uid);
  }

  async getSession(uid: string): Promise<SessionState | null> {
    const cacheKey = this.buildSessionCacheKey(uid);
    const cachedSession = await this.getCachedSession(cacheKey);

    if (cachedSession) {
      return cachedSession;
    }

    const state = await this.prisma.sessionState.findUnique({
      where: { uid },
    });

    if (!state) {
      return null;
    }

    const mappedSession = this.mapToSessionState(state);
    await this.setCachedSession(cacheKey, mappedSession);

    return mappedSession;
  }

  async createState(uid: string, initialData?: Partial<SessionState>): Promise<SessionState> {
    const dataToCreate = {
      uid,
      equation: initialData?.equation ?? null,
      problemType: initialData?.problemType ?? null,
      step: initialData?.step ?? 0,
      history: initialData?.history ?? [],
      nextState: initialData?.next_state ?? null,
    };

    const state = await this.prisma.sessionState.create({
      data: dataToCreate,
    });

    const mappedSession = this.mapToSessionState(state);
    await this.setCachedSession(this.buildSessionCacheKey(uid), mappedSession);

    return mappedSession;
  }

  async updateState(uid: string, data: Partial<SessionState>): Promise<SessionState> {
    const dataToUpdate: {
      equation?: string | null;
      problemType?: SessionState['problemType'];
      step?: number;
      history?: SessionState['history'];
      nextState?: string | null;
    } = {};

    if (data.equation !== undefined) dataToUpdate.equation = data.equation;
    if (data.problemType !== undefined) dataToUpdate.problemType = data.problemType;
    if (data.step !== undefined) dataToUpdate.step = data.step;
    if (data.history !== undefined) dataToUpdate.history = data.history;
    if (data.next_state !== undefined) dataToUpdate.nextState = data.next_state;

    const state = await this.prisma.sessionState.update({
      where: { uid },
      data: dataToUpdate,
    });

    const mappedSession = this.mapToSessionState(state);
    await this.setCachedSession(this.buildSessionCacheKey(uid), mappedSession);

    return mappedSession;
  }

  async deleteState(uid: string): Promise<void> {
    await this.prisma.sessionState.delete({
      where: { uid },
    });

    await this.deleteCachedSession(this.buildSessionCacheKey(uid));
  }

  private buildSessionCacheKey(uid: string): string {
    return `socratix:session:${uid}`;
  }

  private async getCachedSession(cacheKey: string): Promise<SessionState | null> {
    try {
      const raw = await this.redis.get(cacheKey);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      const validatedSession = SessionStateSchema.safeParse(parsed);

      if (!validatedSession.success) {
        await this.redis.del(cacheKey);
        return null;
      }

      return validatedSession.data;
    } catch (error) {
      this.logger.warn(
        `Redis cache read failed for key "${cacheKey}". Falling back to PostgreSQL.`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  private async setCachedSession(cacheKey: string, state: SessionState): Promise<void> {
    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(state),
        'EX',
        PrismaStateManagerService.SESSION_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(
        `Redis cache write failed for key "${cacheKey}".`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async deleteCachedSession(cacheKey: string): Promise<void> {
    try {
      await this.redis.del(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Redis cache delete failed for key "${cacheKey}".`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private mapToSessionState(state: {
    uid: string;
    equation: string | null;
    problemType: string | null;
    step: number;
    history: unknown;
    nextState: string | null;
  }): SessionState {
    return {
      uid: state.uid,
      equation: state.equation,
      problemType: state.problemType as SessionState['problemType'],
      step: state.step,
      history: Array.isArray(state.history) ? state.history : [],
      next_state: state.nextState,
    };
  }
}
