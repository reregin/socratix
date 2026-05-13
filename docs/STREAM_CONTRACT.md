# SSE Stream Contract v1

This document defines the shared contract for the Socratix chat stream between:
- NestJS backend streaming controller
- AI3 visualizer/scene output
- frontend chat consumer

The source-of-truth TypeScript types live in `packages/shared-types/src/chat-stream.ts`.

## 1. Request Shape

The frontend sends a chat request body shaped like:

```json
{
  "message": "Solve 3x + 5 = 14",
  "sessionId": "optional-session-id"
}
```

Fields:
- `message`: required raw student message
- `sessionId`: optional chat/session identifier for stateful conversations

Current backend note:
- the backend SSE endpoint accepts this body over `POST /chat` and responds with `text/event-stream`

## 2. SSE Event Types

The backend emits SSE events whose `data` payload must match one of these shapes:
- `progress`
- `token`
- `scene`
- `done`
- `error`

## 3. Event Payloads

### `progress`

Used for pipeline status updates.

```json
{
  "type": "progress",
  "step": "routing",
  "status": "started",
  "label": "Connecting to pipeline..."
}
```

### `token`

Used for incremental assistant text streaming.

```json
{
  "type": "token",
  "messageId": "assistant-1",
  "text": "Let's start by isolating x. "
}
```

Rules:
- `messageId` must remain stable across all text chunks for the same assistant reply
- the client appends `text` chunks in arrival order

### `scene`

Used for visualization side-channel updates.

```json
{
  "type": "scene",
  "messageId": "assistant-1",
  "scene": {
    "scene": [
      {
        "component": "BalanceScale",
        "props": {}
      }
    ],
    "animation": null
  }
}
```

Rules:
- `scene` payload should reuse the existing AI3 visualizer shape
- `scene` events do not create a chat message on their own
- the latest `scene` event for a given `messageId` replaces the current visualization state for that response

### `done`

Signals that the assistant response is complete.

```json
{
  "type": "done",
  "messageId": "assistant-1"
}
```

Rules:
- when `done` arrives, the client stops loading/streaming state for that `messageId`

### `error`

Signals a recoverable streaming failure.

```json
{
  "type": "error",
  "message": "Streaming failed"
}
```

Rules:
- clients should stop streaming state and surface a fallback error UI

## 4. Ordering Expectations

Typical stream order:
1. optional `progress`
2. one or more `token`
3. optional `scene` at any point after stream start
4. final `done`

If an unrecoverable issue occurs, `error` may replace `done`.

## 5. Current Scope

This is a transport-level SSE contract, not a `useChat`-internal contract.

Reason:
- AI3 already has a concrete scene descriptor implementation
- the current frontend chat shell is not yet wired to real `useChat`
- this contract should remain stable even if the frontend transport implementation changes later
