import { SessionState } from './state.schema';

export interface IStateManager {
  getSession(uid: string): Promise<SessionState | null>;
  getState(uid: string): Promise<SessionState | null>;
  createState(uid: string, initialData?: Partial<SessionState>): Promise<SessionState>;
  updateState(uid: string, data: Partial<SessionState>): Promise<SessionState>;
  deleteState(uid: string): Promise<void>;
}
