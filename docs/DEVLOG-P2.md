# P2 — Prompt & Response Engineer Dev Log

## 2026-04-24 — Agent #2: Prompt Builder Service

**1. The Change:**
Created Agent #2 (Prompt Builder) inside `apps/backend/src/agents/prompt-builder/`:

- **`prompt-builder.types.ts`** — Type contracts for all data consumed and produced by the Prompt Builder. Imports and re-exports P1's Zod-inferred types (`RouterOutput`, `PlannerOutput`, `ProblemType`) to avoid duplication. Defines:
  - `PromptBuilderInput` — the merge-point interface combining Router, Planner, State Manager, and Validator outputs
  - `VisualizerPromptOutput` — output sent to P3 (Visualizer)
  - `SceneDescriptor` — received back from P3
  - `ResponsePromptOutput` — output sent to Agent #3 (Response Generator)
  - `ValidationResult`, `ConversationMessage`, `StateSnapshot`, `StudentProfile`

- **`prompt-templates.ts`** — All Socratic prompt template strategies:
  - `SOCRATIC_GUARDRAILS` — anti answer-leakage rules, injected into every prompt
  - `BASE_SYSTEM_PROMPT` — Socratix tutor identity
  - 4 intent-based template functions: `buildAttemptingAnswerIncorrectPrompt`, `buildAttemptingAnswerCorrectPrompt`, `buildConceptualHelpPrompt`, `buildNewProblemPrompt`, `buildJustChattingPrompt`
  - 5 error-specific strategies: `wrong_value`, `sign_error`, `arithmetic_error`, `incomplete_step`, `conceptual_error`
  - `AVAILABLE_COMPONENTS` — component mapping per problem type (algebra→BalanceScale, geometry→ShapeCanvas, etc.)
  - `buildVisualizerSystemPrompt()` — prompt for P3 Visualizer
  - `buildSceneContextBlock()` — injects scene JSON into response prompt

- **`prompt-builder.service.ts`** — NestJS `@Injectable()` service (Agent #2) with:
  - `buildVisualizerPrompt(input)` — Phase 4→5a: assembles prompt for P3
  - `buildResponsePrompt(input, scene)` — Phase 5a→5b: assembles final prompt for Agent #3 with scene injection and conversation history
  - Private helpers: `buildBasePromptByIntent()`, `resolveAvailableComponents()`, `summarizeHistory()`

- **`prompt-builder.service.spec.ts`** — 20 unit tests covering visualizer prompts (component resolution, null handling, error/success context) and response prompts (guardrails, celebration, scene injection, all intent templates, history truncation, error strategies)

- **`agents.module.ts`** — Registered `PromptBuilderService` alongside P1's `RouterService` and `PlannerService`

**2. The Reasoning:**
- **Types import P1's Zod schemas directly** — instead of duplicating `RouterOutput` and `PlannerOutput`, we import them from P1's schema files. This means if P1 changes their schema, our types update automatically.
- **Templates separated from service logic** — prompt wording can be iterated independently from control flow. This is important because prompt engineering is a rapid-iteration process.
- **No LLM calls in Prompt Builder** — Agent #2 is pure deterministic code (~5-10ms). The LLM call happens in Agent #3 (Response Generator), which will be built next.
- **Follows P1 code conventions exactly** — `.js` extensions in imports, `Logger`, `@Injectable()`, `Test.createTestingModule` in tests.

**3. The Tech Debt:**
- `AVAILABLE_COMPONENTS` is hardcoded in `prompt-templates.ts`. When P3 adds new SVG components, this map needs manual updating (should ideally be a shared config).
- `studentProfile` is accepted in `PromptBuilderInput` but not yet deeply used in templates (e.g., adjusting language difficulty based on student level). Will be expanded when the feature matures.

---

## 2026-04-24 — Agent #3: Response Generator Service (Groq)

**1. The Change:**
Created Agent #3 (Response Generator) inside `apps/backend/src/agents/response-generator/`:

- **`response-generator.service.ts`** — NestJS `@Injectable()` service that calls **Groq API** (Google Gemma 2 9B) via the Vercel AI SDK (`@ai-sdk/groq`):
  - `generateStream(prompt)`: Primary method — calls `streamText()` for token-by-token streaming to SSE (Phase 5b)
  - `generateText(prompt)`: Non-streaming fallback for testing or simple cases
  - Uses `ConfigService` for environment-driven config (`GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_TEMPERATURE`, `GROQ_MAX_TOKENS`)
  - Graceful null return when `GROQ_API_KEY` is not configured (no crash)

- **`response-generator.service.spec.ts`** — 8 unit tests covering:
  - `streamText` called with correct parameters (model, system prompt, temperature, maxOutputTokens)
  - `createGroq` called with the API key
  - Streaming produces correct text chunks
  - Full text generation returns complete response
  - Null fallback when API key is missing (both stream and text)

- **`agents.module.ts`** — Registered `ResponseGeneratorService` alongside `RouterService`, `PlannerService`, `PromptBuilderService`

**2. The Reasoning:**
- **Groq instead of Gemini direct** — Groq's LPU inference hardware provides significantly faster token generation, which is ideal for streaming responses in a tutoring app where latency matters.
- **Same AI SDK pattern as P1** — P1 uses `@ai-sdk/google` with `generateObject`. We use `@ai-sdk/groq` with `streamText`/`generateText`. The Vercel AI SDK abstracts the provider, so swapping models later is a one-line change.
- **`maxOutputTokens` not `maxTokens`** — AI SDK v6 renamed this property. Discovered during TypeScript compilation.
- **`require()` in tests instead of `await import()`** — Jest doesn't support dynamic imports without `--experimental-vm-modules`. Since modules are top-level mocked with `jest.mock()`, `require()` returns the mock correctly.

**3. The Tech Debt:**
- Return type of `generateStream()` is `Promise<any | null>` — the AI SDK's `StreamTextResult` generic is too complex to annotate cleanly. Should revisit when AI SDK stabilizes its types.
- No retry/fallback logic when Groq API returns errors (rate limits, timeouts). Should add exponential backoff for production.
- Model name `gemma2-9b-it` is hardcoded as default — should be validated against Groq's available models list.
