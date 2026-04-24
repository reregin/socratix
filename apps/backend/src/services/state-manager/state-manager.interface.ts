import { SessionState } from './state.schema';

export interface IStateManager {
  getState(uid: string): Promise<SessionState | null>;
  createState(uid: string, initialData?: Partial<SessionState>): Promise<SessionState>;
  updateState(uid: string, data: Partial<SessionState>): Promise<SessionState>;
  deleteState(uid: string): Promise<void>;
}
