import { Injectable } from '@nestjs/common';
import { IStateManager } from './state-manager.interface.js';
import { SessionState } from './state.schema.js';
import { PrismaService } from '../../db/prisma.service.js';

@Injectable()
export class PrismaStateManagerService implements IStateManager {
  constructor(private readonly prisma: PrismaService) {}

  async getState(uid: string): Promise<SessionState | null> {
    const state = await this.prisma.sessionState.findUnique({
      where: { uid },
    });
    
    if (!state) return null;
    
    return {
      uid: state.uid,
      equation: state.equation,
      problemType: state.problemType as any,
      step: state.step,
      history: state.history as any,
      next_state: state.nextState,
    };
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

    return {
      uid: state.uid,
      equation: state.equation,
      problemType: state.problemType as any,
      step: state.step,
      history: state.history as any,
      next_state: state.nextState,
    };
  }

  async updateState(uid: string, data: Partial<SessionState>): Promise<SessionState> {
    const dataToUpdate: any = {};
    if (data.equation !== undefined) dataToUpdate.equation = data.equation;
    if (data.problemType !== undefined) dataToUpdate.problemType = data.problemType;
    if (data.step !== undefined) dataToUpdate.step = data.step;
    if (data.history !== undefined) dataToUpdate.history = data.history;
    if (data.next_state !== undefined) dataToUpdate.nextState = data.next_state;

    const state = await this.prisma.sessionState.update({
      where: { uid },
      data: dataToUpdate,
    });

    return {
      uid: state.uid,
      equation: state.equation,
      problemType: state.problemType as any,
      step: state.step,
      history: state.history as any,
      next_state: state.nextState,
    };
  }

  async deleteState(uid: string): Promise<void> {
    await this.prisma.sessionState.delete({
      where: { uid },
    });
  }
}
