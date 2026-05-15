export type ChatRole = 'user' | 'assistant';

export interface ChatStreamRequest {
  message: string;
  sessionId?: string;
}

export interface StreamSceneComponent {
  component: string;
  props: Record<string, unknown>;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface StreamSceneDescriptor {
  scene: StreamSceneComponent[];
  animation: string | null;
  camera?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    lookAt: {
      x: number;
      y: number;
      z: number;
    };
  };
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
  };
}

export interface ChatStreamTokenEvent {
  type: 'token';
  messageId: string;
  text: string;
}

export interface ChatStreamSceneEvent {
  type: 'scene';
  messageId: string;
  scene: StreamSceneDescriptor;
}

export interface ChatStreamDoneEvent {
  type: 'done';
  messageId: string;
}

export interface ChatStreamErrorEvent {
  type: 'error';
  message: string;
}

export interface ChatStreamProgressEvent {
  type: 'progress';
  step: string;
  status: 'started' | 'completed' | 'failed';
  label: string;
}

export type ChatStreamEvent =
  | ChatStreamTokenEvent
  | ChatStreamSceneEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent
  | ChatStreamProgressEvent;
