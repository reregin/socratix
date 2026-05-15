import type {
  ChatStreamDoneEvent,
  ChatStreamErrorEvent,
  ChatStreamEvent,
  ChatStreamProgressEvent,
  ChatStreamRequest,
  ChatStreamSceneEvent,
  ChatStreamTokenEvent,
} from '../src/chat-stream';

const request: ChatStreamRequest = {
  message: 'Solve 3x + 5 = 14',
  sessionId: 'session-123',
};

const tokenEvent: ChatStreamTokenEvent = {
  type: 'token',
  messageId: 'assistant-1',
  text: "Let's isolate x first. ",
};

const sceneEvent: ChatStreamSceneEvent = {
  type: 'scene',
  messageId: 'assistant-1',
  scene: {
    scene: [
      {
        component: 'BalanceScale',
        props: {
          left: '3x + 5',
          right: '14',
        },
      },
    ],
    animation: null,
  },
};

const progressEvent: ChatStreamProgressEvent = {
  type: 'progress',
  step: 'routing',
  status: 'started',
  label: 'Connecting to pipeline...',
};

const doneEvent: ChatStreamDoneEvent = {
  type: 'done',
  messageId: 'assistant-1',
};

const errorEvent: ChatStreamErrorEvent = {
  type: 'error',
  message: 'Streaming failed',
};

const streamEvents: ChatStreamEvent[] = [
  progressEvent,
  tokenEvent,
  sceneEvent,
  doneEvent,
  errorEvent,
];

void request;
void streamEvents;
