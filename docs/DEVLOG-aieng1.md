# AI Engineer Log (P1 — Intent & Extraction Engineer)

## 2026-04-24 — Agent #0 (Router) + Agent #1 (Planner) Implementation

**1. The Change:**

Created the first two agents in the Socratix multi-agent pipeline:

- **`src/agents/router/router.schema.ts`** — Zod schemas for `IntentEnum` (4 intents) and `RouterOutputSchema` (intent + `validatorRequired`/`plannerRequired` flags).
- **`src/agents/router/router.service.ts`** — Two-tier intent classifier:
  - Tier 1: Regex fast-path with patterns for `attempting_answer`, `conceptual_help`, `new_problem` (~5ms).
  - Tier 2: Gemini Flash-Lite LLM fallback via `generateObject()` for ambiguous messages (~50-100ms).
  - Flag logic: `attempting_answer` → planner ON + validator ON; `conceptual_help`/`new_problem` → planner ON; `just_chatting` → both OFF.
- **`src/agents/router/router.service.spec.ts`** — 26 tests covering regex classification, flag logic, and classify() integration.

- **`src/agents/planner/planner.schema.ts`** — Zod schemas for `ProblemTypeEnum` (4 types) and `PlannerOutputSchema` (equation, studentAnswer, problemType, extractedParams).
- **`src/agents/planner/planner.service.ts`** — Structured extraction service using Gemini Flash-Lite with `generateObject()` and the Planner Zod schema. Extracts equation, student answer, problem classification, and equation parameters from conversation context.
- **`src/agents/planner/planner.service.spec.ts`** — 9 tests covering schema validation (all problem types, rejection cases) and graceful fallback.

- **`src/agents/agents.module.ts`** — Updated to register both services as providers and exports.
- **`src/app.module.ts`** — Added `ConfigModule.forRoot({ isGlobal: true })` for env var access.
- **`package.json`** — Added `ai`, `@ai-sdk/google`, `@nestjs/config` dependencies. Added `moduleNameMapper` to Jest config for `.js` → `.ts` resolution.

**2. The Reasoning:**

- **Two-tier Router**: Regex-first avoids unnecessary LLM calls for obvious intents (saves ~50-100ms and API credits). The LLM fallback handles ambiguous or unusual phrasing gracefully.
- **Vercel AI SDK `generateObject()`**: Used instead of raw Gemini API to leverage built-in Zod schema validation on the LLM response. This guarantees type safety at the agent boundary — the Planner always returns a valid `PlannerOutput`, never an unparseable string.
- **`.js` imports everywhere**: The `tsconfig.json` uses `"module": "nodenext"` which mandates `.js` extensions in imports. At build time these resolve correctly since `tsc` emits `.js` files. For Jest, we added `moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" }` to strip `.js` before ts-jest resolves.
- **Graceful degradation**: Both agents return safe defaults when `GOOGLE_GENERATIVE_AI_API_KEY` is missing (Router defaults to `just_chatting`, Planner returns all-null). This lets the team run the full test suite without API keys.

**3. The Tech Debt:**

- **Image analysis** in the Planner is a TODO placeholder — multimodal input isn't wired yet.
- **No E2E tests** hitting the real Gemini API. The current tests only cover regex logic and fallback behavior. We need integration tests with a live API key (gated behind an env flag).
- **Router regex could be too greedy**: Patterns like `/how/i` may match unintended messages. The regex tier should be tuned against real student message logs once available.
- **No Redis caching** on the Router yet (Layer 1 per PIPELINE.md). This will be added when the BE engineer sets up the Redis connection.

---

## 2026-04-24 — LLM Provider Migration: Gemini → Groq (Router + Planner)

**1. The Change:**

Swapped the LLM backend for Agent #0 (Router) and Agent #1 (Planner) from Google Gemini Flash-Lite to Groq (Llama 3.3 70B Versatile):

- **`src/agents/router/router.service.ts`** — Changed import from `@ai-sdk/google` → `@ai-sdk/groq` (`createGroq`). Model ID changed from `gemini-2.0-flash-lite` → `llama-3.3-70b-versatile`. Env var changed from `GOOGLE_GENERATIVE_AI_API_KEY` → `GROQ_API_KEY`. Updated docstrings/comments.
- **`src/agents/planner/planner.service.ts`** — Same three swaps (import, model, env var) and docstring updates.
- **`.env`** — Added `GROQ_API_KEY` as active env var. Kept `GOOGLE_GENERATIVE_AI_API_KEY` for other agents (P2/P3) that still use Gemini.
- **`npm install`** — `@ai-sdk/groq` was already in `package.json` but not installed in `node_modules`; ran `npm install` to resolve.

All 35 existing tests pass (26 Router + 9 Planner).

**2. The Reasoning:**

- **Vercel AI SDK provider abstraction** makes this a surgical swap — only the provider factory (`createGroq` vs `createGoogleGenerativeAI`) and model ID change. The `generateObject()` call, Zod schemas, prompt strings, and all business logic remain untouched.
- **Groq's `llama-3.3-70b-versatile`** supports structured JSON output via the AI SDK's `generateObject()`, which is the only LLM feature we use in the Router and Planner. This makes it a drop-in replacement.
- **Graceful degradation preserved** — both agents still return safe defaults when `GROQ_API_KEY` is missing, same behavior as before with the Google key.

**3. The Tech Debt:**

- **No live E2E tests against Groq yet.** The existing tests only cover regex logic and no-API-key fallback. We need integration tests hitting the real Groq API to validate structured output quality (equation extraction, intent classification).
- **Model selection not configurable.** The model ID (`llama-3.3-70b-versatile`) is hardcoded. If Groq deprecates this model or a faster one becomes available, we'd need a code change. Consider making this env-configurable in the future.
- **Google dependency still in `package.json`.** `@ai-sdk/google` is still installed since P2/P3 agents may use Gemini. If those agents also migrate, we can remove it.

**Update (Hotfix):** Added `'Must output valid JSON.'` to the end of both Router and Planner prompt arrays. Groq's `llama-3.3-70b-versatile` model requires `structuredOutputs: false` (falling back to `json_object` mode) because it lacks `json_schema` support. The `json_object` mode requires the word "JSON" to exist somewhere in the prompt.

---
