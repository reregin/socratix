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

## 2026-04-25 — Router Agent Integration Tests (20-Sample Set)

**1. The Change:**

- **`src/agents/router/router.service.spec.ts`**: Replaced the original fragmented test cases with a comprehensive parameterized 20-sample integration test suite testing the `classify()` full flow.
- The samples cover all 4 intent categories (`attempting_answer`, `conceptual_help`, `new_problem`, `just_chatting`) including ambiguous inputs and mixed-language edge cases (e.g. "mi answer is 5").
- Updated test comments to align with the "Readable" rule in `AGENTS.md` (explaining *why* the tests exist instead of *what* they are).
- Executed tests locally using `npm run test -- router.service.spec.ts` (all 25 assertions passing).

**2. The Reasoning:**

- The two-tier routing system (Regex + LLM) is the critical first step of the pipeline. Hardcoding a robust 20-sample integration test ensures that both the fast-path regex and the LLM fallback (mocked as `just_chatting` without an API key) gracefully handle real-world student inputs.
- Parameterized testing (an array of inputs/expected outputs iterated via `forEach`) is the standard practice for deterministic router functions. It reduces repetition and makes the tests self-documenting.

**3. The Tech Debt:**

- The tests still only mock the LLM fallback. The 20-sample set assumes that inputs bypassing the regex (like "hello there") will hit the LLM. In this test environment, they hit the `just_chatting` fallback. True E2E tests validating Groq's intent extraction are still pending.

**4. Test Results:**

```text
 PASS  src/agents/router/router.service.spec.ts
  RouterService
    classifyByRegex — Tier 1
      √ should return null for ambiguous messages (1 ms)
    buildOutput — flag logic
      √ attempting_answer → planner ON, validator ON
      √ conceptual_help → planner ON, validator OFF
      √ new_problem → planner ON, validator OFF
      √ just_chatting → planner OFF, validator OFF (1 ms)
    classify — full flow (20-sample set)
      √ Sample 1: should classify "I think the answer is 9" → attempting_answer (1 ms)
      √ Sample 2: should classify "i got 42" → attempting_answer
      √ Sample 3: should classify "my answer is 3" → attempting_answer (1 ms)
      √ Sample 4: should classify "The result is 7" → attempting_answer
      √ Sample 5: should classify "I believe it's 5" → attempting_answer
      √ Sample 6: should classify "Can you help me?" → conceptual_help (1 ms)
      √ Sample 7: should classify "Explain how to solve this" → conceptual_help (1 ms)
      √ Sample 8: should classify "How do I factor this?" → conceptual_help
      √ Sample 9: should classify "Why do we divide both sides?" → conceptual_help
      √ Sample 10: should classify "What does x represent?" → conceptual_help
      √ Sample 11: should classify "Give me a new problem" → new_problem (1 ms)
      √ Sample 12: should classify "Next question please" → new_problem (1 ms)
      √ Sample 13: should classify "Another one" → new_problem (1 ms)
      √ Sample 14: should classify "I want a different problem" → new_problem
      √ Sample 15: should classify "Let's start over" → new_problem
      √ Sample 16: should classify "hello there" → just_chatting (1 ms)
      √ Sample 17: should classify "ok cool" → just_chatting (1 ms)
      √ Sample 18: should classify "hmm let me think" → just_chatting (1 ms)
      √ Sample 19: should classify "mi answer is 5" → attempting_answer
      √ Sample 20: should classify "ayuda me explain this" → conceptual_help (1 ms)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.128 s
```

**Update (Live E2E Testing):**
Following the unit test implementation, we created a dedicated E2E test file (`test/router.e2e-spec.ts`) that successfully loads the `.env` file and hits the live Groq API (`llama-3.3-70b-versatile`). 
- This E2E suite proves that the LLM successfully parses ambiguous prompts (e.g., "I'm totally lost, I'm just staring at the formula blankly" → `conceptual_help`) and outputs valid JSON, resolving the "Tech Debt" mentioned above.
- We also updated `test/jest-e2e.json` to include the `moduleNameMapper` so that `.js` imports inside the `src` folder resolve correctly during E2E testing.

---

## 2026-05-13 — Agent #0 & #1 Reliability and Hardening

**1. The Change:**

Implemented the 11-point improvement plan from `docs-archive/improve-plan.md` to harden the Router and Planner agents:
- **`src/agents/router/router.service.ts`**: Wrapped `generateObject` in try/catch to gracefully default to `just_chatting` on LLM failure. Documented the `regexPatterns` order dependency and `slice(-6)` context limit. Wrapped user input in `"""` to prevent prompt injection.
- **`src/agents/planner/planner.schema.ts`**: Changed `studentAnswer` to `z.union([z.number(), z.string()])` to support algebraic answers. Added `.catch(null)` to nullable fields for resilience. Standardized `extractedParams` and added a stub for `imageContext`.
- **`src/agents/planner/planner.service.ts`**: Wrapped `generateObject` in try/catch. Exported `EMPTY_PLANNER_OUTPUT` for tests. Standardized `extractedParams` in the prompt and added a hint for the `new_problem` intent. Documented the `slice(-10)` context limit. Wrapped user input in `"""`.
- **`src/agents/planner/planner.service.spec.ts`**: Updated the unit tests to handle the new string-based `studentAnswer` support and the added `imageContext` field.

**2. The Reasoning:**

- **Production Reliability**: Try/catches around `generateObject` are critical because external API calls (Groq) can fail due to rate limits or timeouts. The system must degrade gracefully without crashing.
- **Robustness**: Updating `studentAnswer` to accept strings prevents parsing errors when a student answers with a fraction or variable expression, which will be handled downstream by SymPy. `.catch(null)` on schema properties ensures partial extraction succeeds even if one field is malformed.
- **Security**: Wrapping the student's message in triple quotes `"""` mitigates basic prompt injection attacks ("ignore all previous instructions").

**3. The Tech Debt:**

- **Router Redis Cache**: The Router still lacks Redis caching (Layer 1 per PIPELINE.md), which is a backend engineering dependency. This is required before load testing to achieve the sub-500ms first token target.

---

## 2026-05-13 — Router Intent Accuracy Tuning (Live Groq E2E)

**1. The Change:**
- Created `test/router-accuracy.e2e-spec.ts` — live Groq E2E accuracy harness
  testing all 20 samples against real Groq API with per-sample pass/fail reporting,
  tier classification (regex vs LLM), and overall/LLM-only accuracy scores.
- Added `test:e2e:router` npm script in `package.json`.
- Added `testTimeout: 60000` to `test/jest-e2e.json`.
- Tuned `classifyByLLM()` prompt in `router.service.ts` — added a "Common mistakes to avoid"
  section with negative examples for thinking-aloud phrases and short acknowledgments.

**2. Baseline Results (before tuning):**
- Overall: 19/20 (95%)
- LLM tier only: 2/3 (67%)
- Misclassified: "hmm let me think" → got "conceptual_help", expected "just_chatting"

**3. What Failed & Why:**
- "hmm let me think" was classified as `conceptual_help` because the LLM interpreted
  "let me think" as a request for thinking time/help, rather than the student simply
  thinking aloud. Without explicit guidance, the LLM defaults to the more "active"
  intent when the message contains verb phrases.

**4. Fixes Applied:**
- Iteration 1 — Tool A (negative examples): Added "Common mistakes to avoid" section
  to the prompt with explicit rules for thinking-aloud phrases and short acknowledgments.
  Result: 20/20 (100%), LLM-only: 3/3 (100%).

**5. Final Results (after tuning):**
- Overall: 20/20 (100%)
- LLM tier only: 3/3 (100%)

**6. Tech Debt:**
- The E2E test runs 20 sequential Groq calls. If the sample set grows significantly,
  consider parallelizing or batching to reduce test runtime.
- LLM results are non-deterministic — a passing run today does not guarantee 100%
  on every future run. Consider running 3x and taking worst-case for CI gating.

---

## 2026-05-15 - Router/Planner English-Only JSON Parsing and Extraction Expansion

**1. The Change:**
- Updated `apps/backend/src/agents/router/router.service.ts` to tighten regex priority for `attempting_answer`, remove the unsafe broad `next` trigger for `new_problem`, route direct solve requests into `conceptual_help`, and replace Groq `generateObject()` usage with JSON-only `generateText()` plus local Zod validation.
- Expanded `apps/backend/src/agents/planner/planner.schema.ts` with additive fields: `problemText`, `subtype`, `normalizedExpression`, `target`, and `confidence`, while preserving the legacy controller-facing fields as required nullable properties.
- Reworked `apps/backend/src/agents/planner/planner.service.ts` to use JSON-only text prompting, prioritize the latest user message over stale history, classify sequences as algebra subtypes, and return a normalized null-filled `EMPTY_PLANNER_OUTPUT`.
- Replaced the Router and Planner specs with focused coverage for English-only routing, sequence answer attempts, direct solve requests, expanded planner schema validation, and the regression where an older equation must not override a newer one.

**2. The Reasoning:**
- The Groq warning came from relying on structured object generation in a mode that is not supported cleanly for the chosen model path, so switching to explicit JSON prompting keeps the contract under our control and makes validation failures easier to reason about.
- Router regexes needed to become more specific because natural language sequence answers contain words like `next` that were previously colliding with `new_problem`.
- The Planner needed additive structure instead of an equation-only shape so arithmetic, geometry, and statistics prompts can produce useful extracted context without requiring controller changes owned by another teammate.
- Keeping the original planner fields required and null-safe avoided breaking the existing `chat.controller.ts` integration while still letting us expand the Planner's capabilities.

**3. The Tech Debt:**
- `chat.controller.ts` still assumes equation-centric downstream behavior, so the richer planner fields are currently underused until the backend owner broadens validator/response handling for non-equation math contexts.
- The backend build is still blocked by the existing missing module/type resolution for `@socratix/shared-types/chat-stream`, which is unrelated to these Router/Planner changes.
- Router and Planner now rely on prompt-disciplined JSON parsing; if model output drift becomes an issue, we may want a shared JSON extraction helper with more defensive recovery and telemetry.
