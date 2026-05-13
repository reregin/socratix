# Backend Developer Log

## 2026-04-24 - NestJS Module Scaffold

**1. The Change:** 
Created the core structural modules for the NestJS backend (`AgentsModule`, `ChatModule`, `ServicesModule`, `DbModule`) and imported them into the root `AppModule`.

**2. The Reasoning:** 
Following the PRD architecture to separate the monolith into a Next.js frontend and NestJS backend. This scaffold establishes the necessary dependency injection boundaries for the multi-agent pipeline, services, and chat controller.

**3. The Tech Debt:** 
Currently, the modules are completely empty shells with no actual providers, controllers, or exports. They will be progressively populated as we build out the state manager, prompt builder, validator, and chat controller.

---

## 2026-04-24 - State Manager Interface & Zod Schema

**1. The Change:** 
- Installed `zod` in the `apps/backend` package to resolve missing module errors.
- Defined `SessionStateSchema` in `state.schema.ts`.
- Created the `IStateManager` interface in `state-manager.interface.ts`.

**2. The Reasoning:** 
This lays the foundation for moving from the POC's in-memory `Map` to persistent state storage (PostgreSQL/Redis) as outlined in the PRD. The interface ensures the pipeline can interact with state abstractly without worrying about the underlying DB implementation details yet. Zod provides runtime validation for state data entering the pipeline.

**3. The Tech Debt:** 
The actual concrete implementation of `IStateManager` (e.g., SupabaseStateManager) is still pending. We only have the interfaces so far.

---

## 2026-04-24 - SSE Chat Controller Skeleton

**1. The Change:** 
- Created `ChatController` inside `apps/backend/src/chat/chat.controller.ts`.
- Set up an empty `@Sse()` endpoint (`@Post() streamChat`) that currently returns a dummy observable `MessageEvent` emitting a single progress step.
- Registered `ChatController` in `chat.module.ts`.

**2. The Reasoning:** 
This prepares the backend to communicate with the frontend using Server-Sent Events (SSE). The architecture requires streaming updates for the Socratic AI responses as well as intermediate "chain-of-thought" progress states. Establishing this `@Sse()` endpoint allows us to test the NestJS streaming setup before wiring up the actual multi-agent logic.

**3. The Tech Debt:** 
The endpoint currently returns static placeholder data (`Observable<MessageEvent>`) rather than integrating with the `Agent #0 Router` and the `Vercel AI SDK` stream.

---

## 2026-04-24 - JWT Auth Guard Stub

**1. The Change:** 
- Created `JwtAuthGuard` in `apps/backend/src/services/auth/jwt-auth.guard.ts`.
- The guard reads the `Authorization` header and throws a `401 UnauthorizedException` if it's missing or unconditionally rejects the request.

**2. The Reasoning:** 
Following the PRD requirement to authenticate users via NextAuth.js JWTs. Creating this stub early allows the frontend team to test passing the `Authorization: Bearer <token>` header to the backend endpoints, even while the backend token verification logic is still under development.

**3. The Tech Debt:** 
There is no actual JWT decoding or verification happening yet. It's hardcoded to return a `401 Unauthorized` error until the integration with NextAuth's secret/public key is implemented.

---

## 2026-04-24 - Config Module Setup

**1. The Change:** 
- Configured `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` in `AppModule`.
- Created an `.env.example` template with placeholders for `DATABASE_URL` (Supabase), `REDIS_URL`, and `GEMINI_API_KEY`.

**2. The Reasoning:** 
The multi-agent pipeline requires API keys (Gemini), and the State Manager requires connection strings (Supabase, Redis). Hardcoding these is a security risk. `ConfigModule` ensures the backend can safely load these secrets from a local `.env` file during development and from injected environment variables in production.

**3. The Tech Debt:** 
Currently, the `DbModule` and `ServicesModule` are not yet consuming these configuration variables. They just sit in the global config space waiting to be injected into the respective connection providers.

---

## 2026-04-24 - Postgres Schema Draft

**1. The Change:** 
- Removed references to the Teacher Dashboard and teacher roles from `PRD.md`.
- Created `apps/backend/src/db/schema.sql` defining the PostgreSQL schema.
- The schema includes the required NextAuth adapter tables (`users`, `accounts`, `sessions`, `verification_tokens`) and our pipeline tables (`chat_sessions`, `session_states`).

**2. The Reasoning:** 
We need to lock in the database schema early so both the Next.js frontend (using NextAuth) and the NestJS backend (using the State Manager) have a single source of truth for the data model. Providing the `.sql` file ensures the schema is version controlled alongside the code.

**3. The Tech Debt:** 
We have not yet implemented an ORM (like Prisma or TypeORM) or the NestJS service to actually execute queries against these tables. We only have the raw SQL definitions so far.

---

## 2026-04-24 - Prisma ORM Integration

**1. The Change:** 
- Initialized Prisma ORM inside the `apps/backend`.
- Translated the SQL schema into a strict `schema.prisma` mapping.
- Created `PrismaService` extending the `PrismaClient` to handle database connections.
- Exported `PrismaService` from `DbModule`.

**2. The Reasoning:** 
As defined in the PRD, moving from a POC in-memory State Manager to production requires type-safe queries to PostgreSQL. Prisma acts as the bridge, ensuring our `DbModule` can easily and safely query `session_states` without writing raw SQL. It also manages DB migrations going forward.

**3. The Tech Debt:** 
The State Manager is still just an interface and not yet wired to use this `PrismaService`.

---

## 2026-04-24 - Prisma State Manager Implementation

**1. The Change:** 
- Created `PrismaStateManagerService` that correctly implements the `IStateManager` interface using `PrismaService`.
- Bound the `'IStateManager'` token to the concrete `PrismaStateManagerService` inside `ServicesModule`.
- Created a `scratch/test-state.ts` script to verify relational integrity (User -> ChatSession -> SessionState).

**2. The Reasoning:** 
This completely finalizes the transition from the legacy "in-memory map" state management to a persistent, scalable PostgreSQL storage layer as defined in the P2 goals in the PRD. By using NestJS Dependency Injection, the AI Agents can now inject `@Inject('IStateManager')` without knowing or caring that Prisma is running under the hood.

**3. The Tech Debt:** 
The implementation assumes that the `ChatSession` (and its associated User) is created *prior* to `createState` being called by the pipeline. If the pipeline encounters a missing Chat ID, Prisma will throw a Foreign Key constraint error.

---

## 2026-04-25 - Redis Client + Cache-Aside for Session Reads

**1. The Change:** 
- Added Redis dependency declaration (`ioredis`) in `apps/backend/package.json`.
- Added Redis DI wiring in the DB layer:
  - `apps/backend/src/db/redis.constants.ts`
  - `apps/backend/src/db/redis.provider.ts`
  - `apps/backend/src/db/redis-lifecycle.service.ts`
  - updated `apps/backend/src/db/db.module.ts` to provide/export Redis client token.
- Extended state manager contract with `getSession(uid)` in `apps/backend/src/services/state-manager/state-manager.interface.ts`.
- Implemented cache-aside in `apps/backend/src/services/state-manager/prisma-state-manager.service.ts`:
  - `getSession(uid)` checks Redis first, falls back to PostgreSQL on miss, then backfills Redis with TTL.
  - `getState(uid)` now delegates to `getSession(uid)` for backwards compatibility.
  - `createState`/`updateState` now write-through to Redis.
  - `deleteState` invalidates Redis key.
  - Added defensive parsing via `SessionStateSchema.safeParse` for cached payloads.

**2. The Reasoning:** 
This aligns with the PRD requirement to use Redis as an ephemeral state acceleration layer while PostgreSQL remains the source of truth. Cache-aside on read (`getSession`) minimizes repeated DB hits for hot sessions and keeps failure behavior safe by falling back to DB when cache is unavailable or malformed.

**3. The Tech Debt:** 
- TTL is currently hardcoded to 300 seconds in `PrismaStateManagerService`; this should be moved to configuration.
- Redis errors are logged and swallowed to preserve pipeline availability; once observability is in place, we should add metrics/alerts for cache hit ratio and Redis failure rates.
- `apps/backend/package-lock.json` is not yet updated in this session; dependency install/lockfile refresh should be run locally.

---

## 2026-04-26 - Validation Result Cache Layer

**1. The Change:**
- Added a standalone backend validator layer under `apps/backend/src/services/validator/`.
- Added `MathValidatorService` for deterministic arithmetic/algebra validation using Math.js.
- Added `ValidationCacheService` to cache validation results in Redis with versioned keys shaped around `equation:answer` pairs.
- Added `CachedValidatorService` and exported it through the `IValidator` token in `ServicesModule`.
- Declared the `mathjs` dependency in `apps/backend/package.json`.

**2. The Reasoning:**
This keeps validation caching independent from phase-2 SSE/chat orchestration while still making it injectable for that future integration. Redis now stores deterministic validation results such as `socratix:validation:v1:3x+5=14:9`, and cache misses fall through to Math.js validation. The TTL defaults to 24 hours via `VALIDATION_CACHE_TTL_SECONDS`, because validation results are deterministic and can safely live longer than session state.

**3. The Tech Debt:**
- `apps/backend/package-lock.json` was intentionally not updated; run the dependency install command locally to refresh it.
- The validator currently supports arithmetic and simple one-variable algebra well, but geometry/statistics validation remains unsupported unless the expression reduces to arithmetic.
- Error classification is currently coarse (`wrong_value` vs `none`); later validator work should distinguish sign errors, arithmetic mistakes, incomplete steps, and conceptual errors.

---

## 2026-04-26 - TypeScript Config Deprecation Cleanup

**1. The Change:**
- Removed the deprecated `baseUrl` compiler option from `apps/backend/tsconfig.json`.

**2. The Reasoning:**
The backend does not define `paths` aliases and currently uses package imports or relative imports, so `baseUrl` was unnecessary. Removing it clears the TypeScript 6 migration warning without relying on `ignoreDeprecations`.

**3. The Tech Debt:**
- If backend path aliases are introduced later, they should be added with the current TypeScript-supported configuration pattern instead of reintroducing deprecated `baseUrl` usage.

---

## 2026-04-26 - Math.js AST Validator Hardening

**1. The Change:**
- Reworked `MathValidatorService` to parse expressions through Math.js AST nodes before evaluation.
- Added deterministic validation for algebraic substitution, simple linear expected-value solving, arithmetic expressions, and concrete equality checks such as `3(9)+5=14` returning incorrect while `3(3)+5=14` returns correct.
- Added `math-validator.service.spec.ts` with 10+ cases covering correct/incorrect algebra answers, implicit multiplication, parentheses, negatives, decimals, arithmetic, placeholders, safe functions, unsupported domains, and unsafe expressions.

**2. The Reasoning:**
The PRD calls for replacing naive `nerdamer-prime`-style string validation with a deterministic Math.js AST validator. Parsing through Math.js AST gives us a safer and more explicit validation boundary while preserving the cache layer from the previous task. Unsupported geometry/statistics cases still return `null` instead of guessing.

**3. The Tech Debt:**
- Linear solving is intentionally scoped to one-variable equations; quadratic and multi-variable equations still need a fuller symbolic strategy.
- Error classification remains basic (`wrong_value`/`none`) until we add step-level diagnosis.
- Tests were added but not run in this session per local workflow preference.

---

## 2026-05-13 - JWT Verification Guard Completion

**1. The Change:**
- Upgraded `apps/backend/src/services/auth/jwt-auth.guard.ts` from a stub into real bearer-token verification using `jsonwebtoken`.
- Wired the guard to read `NEXTAUTH_SECRET` from `ConfigService`, with `AUTH_SECRET` fallback for Auth.js compatibility.
- Added `apps/backend/src/services/auth/jwt-auth.guard.spec.ts` covering missing headers, malformed bearer headers, missing secret, expired tokens, invalid signatures, and successful payload attachment to `request.user`.
- Added `NEXTAUTH_SECRET` to `apps/backend/.env.example`.
- Declared `jsonwebtoken` and `@types/jsonwebtoken` in `apps/backend/package.json`.

**2. The Reasoning:**
The PRD calls for NextAuth.js on the frontend with JWT verification on the NestJS backend. This change closes the gap between the frontend auth contract and backend protection layer by making guarded endpoints reject invalid or expired tokens deterministically while still keeping the guard framework-agnostic through `ConfigService`.

**3. The Tech Debt:**
- The dependency install refreshed the workspace root `package-lock.json` rather than a backend-local lockfile because this repo is using npm workspaces.
- The guard currently verifies signature and expiry only; it does not yet enforce issuer, audience, or application-specific claims.
- The decoded payload is attached to `request.user`, but we have not introduced a typed request decorator or user-context helper for downstream controllers yet.

---

## 2026-05-13 - Backend Auth Secret Setup Note

**1. The Change:**
- Clarified `apps/backend/.env.example` so `NEXTAUTH_SECRET` explicitly documents that it must match the frontend auth secret exactly.

**2. The Reasoning:**
The JWT verification guard is now live on the backend side, so the most important follow-up is making the secret-sharing requirement impossible to miss during environment setup.

**3. The Tech Debt:**
- This is documentation-only on the backend side; frontend Auth.js / NextAuth wiring still needs to supply tokens signed with the same secret before protected backend routes can be exercised end-to-end.

---

## 2026-05-13 - Request Logging Middleware and Global Exception Filter

**1. The Change:**
- Added `RequestLoggingMiddleware` under `apps/backend/src/common/middleware/` and applied it globally from `AppModule`.
- Added `GlobalExceptionFilter` under `apps/backend/src/common/filters/` and registered it in `main.ts`.
- Added shared request/user helper types under `apps/backend/src/common/http/`.
- Added unit tests for both the middleware and the exception filter to verify log shape, anonymous fallback, stable JSON error responses, and the absence of sensitive fields in logs.

**2. The Reasoning:**
The PRD calls for observability on the NestJS API, and this gives us a safe baseline without leaking request bodies, emails, or raw exception details. The middleware emits only method, path, status, duration, and `userId`, while the global filter standardizes client-facing errors and keeps internal exception details out of 500 responses.

**3. The Tech Debt:**
- We have not introduced correlation/request IDs yet, so cross-service tracing is still limited.
- The global filter currently flattens array validation messages into a single string; if the frontend needs structured field-level validation errors later, we should extend the response schema deliberately.

---

## 2026-05-13 - Backend QA Scripts and Env Coverage

**1. The Change:**
- Added `validation-cache.service.spec.ts` to cover Redis-backed validation cache behavior, including normalized keys, malformed cache eviction, TTL handling, and graceful Redis failures.
- Added targeted npm scripts in `apps/backend/package.json` for validator, auth, logging, and a combined backend QA unit-test pass.
- Documented `VALIDATION_CACHE_TTL_SECONDS` in `apps/backend/.env.example`.

**2. The Reasoning:**
The pre-PR QA task calls out Math.js validation, Redis caching, JWT guard, and logging specifically, so the repo now has one-command scripts for each area plus an aggregate run. Documenting the validator cache TTL closes the env gap between implementation and setup guidance.

**3. The Tech Debt:**
- These QA scripts currently cover unit tests only; Redis and database behavior still deserve a later integration pass against real infrastructure.
- We still do not have a dedicated unit test around the `CachedValidatorService` orchestration layer itself, although the underlying validator and cache pieces are now individually covered.

---

## 2026-05-13 - Shared SSE Contract Scaffold

**1. The Change:**
- Converted `packages/shared-types` from an empty placeholder into a real workspace package.
- Added shared chat stream request/event types in `packages/shared-types/src/chat-stream.ts`.
- Added `docs/STREAM_CONTRACT.md` documenting the SSE contract for token, scene, done, error, and progress events.

**2. The Reasoning:**
Sprint 2 integration work depends on FE and AI3 agreeing on one stream contract, but the frontend is not yet on real `useChat` and the backend SSE controller is still placeholder-level. Putting the transport-level contract in `shared-types` gives both sides a single source of truth before we attempt a full FE/BE end-to-end test.

**3. The Tech Debt:**
- The shared types are defined but not yet imported by the backend controller or frontend chat shell; adoption still needs to happen on both sides.
- The contract currently documents a transport-level SSE shape rather than the final AI SDK `useChat` protocol mapping, which may need a translation layer later.

---

## 2026-05-13 - Shared Types Smoke Test

**1. The Change:**
- Added a `typecheck` script to `packages/shared-types/package.json`.
- Added `packages/shared-types/tsconfig.json`.
- Added `packages/shared-types/test/chat-stream.smoke.ts` with compile-time sample request and event payloads for the SSE contract.

**2. The Reasoning:**
At this stage the shared contract is not yet wired into runtime backend/frontend code, so the most reliable low-friction test is a TypeScript smoke test. This catches broken exports or drift in the contract shape without waiting on FE integration.

**3. The Tech Debt:**
- This is a compile-time shape test only; it does not yet prove that NestJS emits these events at runtime.
- Once the backend SSE controller adopts the shared types, we should add a real stream integration test that validates event ordering and payload serialization over HTTP.

---

## 2026-05-13 - CLI-Testable SSE Chat Controller Integration

**1. The Change:**
- Replaced the placeholder `apps/backend/src/chat/chat.controller.ts` with a real SSE controller that orchestrates Router, Planner, Validator, Prompt Builder, Visualizer, and Response Generator.
- Updated `apps/backend/src/chat/chat.module.ts` to import `AgentsModule` and `ServicesModule`.
- Added `apps/backend/test/chat.e2e-spec.ts` to verify that `POST /chat` emits progress, scene, token, and done events over `text/event-stream`.
- Added `apps/backend/scratch/test-chat-sse.mjs` plus `test:sse:cli` and `test:e2e:sse` scripts in `apps/backend/package.json`.
- Updated `docs/STREAM_CONTRACT.md` to clarify that the current backend uses `POST /chat` for SSE.

**2. The Reasoning:**
The full FE `useChat` integration is not ready yet, but backend ownership of the streaming controller means we can still prove the orchestration path from prompt input to streamed SSE output using CLI and backend E2E tests. The controller now emits the shared contract in a way FE can wire up later, while retaining a deterministic fallback stream when LLM response streaming is unavailable.

**3. The Tech Debt:**
- The controller currently uses empty conversation history and a fixed step value because session-backed chat history orchestration is not wired into this endpoint yet.
- When `GROQ_API_KEY` is missing, response text falls back to a deterministic backend-generated Socratic prompt rather than a real LLM stream.
- The controller currently imports shared stream types through a direct source-path type import; once workspace package consumption is fully standardized, we should switch to the package import path everywhere.
- Existing Nest start scripts still assume `dist/main`/`dist/main.js`, while the current build layout emits to `dist/apps/backend/src/main.js`. A follow-up cleanup should normalize the backend runtime entrypoints.

---

## 2026-05-13 - SSE Pipeline Debug Logging

**1. The Change:**
- Added controller-level diagnostic logs in `apps/backend/src/chat/chat.controller.ts` for router output, planner extraction, validator result, visualizer result, and whether the response stream came from the LLM or backend fallback.

**2. The Reasoning:**
The SSE transport is now working, but prompt-level debugging still needs visibility into where the pipeline loses useful math context. These logs make backend-only CLI testing practical without changing FE behavior or requiring model-quality ownership from the backend side.

**3. The Tech Debt:**
- These diagnostics currently log pipeline summaries at `log`/`warn` level for easier local debugging; once the integration stabilizes, we may want to downgrade some of them to `debug` or gate them behind an environment flag to reduce noise.

---

## 2026-05-13 - SSE Cost Guard for Missing Math Context

**1. The Change:**
- Updated `apps/backend/src/chat/chat.controller.ts` so downstream expensive stages are gated on resolved math context.
- When the planner does not resolve an equation, the controller now skips visualizer generation and skips the response-generator LLM call, then streams a deterministic backend clarification instead.
- Added `apps/backend/src/chat/chat.controller.spec.ts` to verify the skip path.

**2. The Reasoning:**
Backend orchestration should not pay for scene generation or streamed LLM output when upstream context is insufficient. This keeps the SSE contract intact for FE while reducing wasted model calls during ambiguous or low-context requests.

**3. The Tech Debt:**
- The current gating checks only for a resolved `equation`; once session-backed history/state is wired in, this should be upgraded to use the fully resolved conversation context rather than only the current merged prompt snapshot.

---

## 2026-05-13 - Soft Fallback on Agent Timeout/Failure

**1. The Change:**
- Updated `apps/backend/src/chat/chat.controller.ts` so planner, visualizer, and response-generator failures no longer abort the entire SSE stream.
- Stage failures now emit `progress` events with `status: "failed"` and continue into deterministic backend fallback guidance instead of returning a terminal stream error.
- Extended `apps/backend/src/chat/chat.controller.spec.ts` to cover planner-throw fallback behavior.

**2. The Reasoning:**
For Sprint 2 backend testing, a degraded but complete stream is more useful than a hard failure. This preserves the SSE contract and gives FE something stable to wire against later, while still surfacing backend-stage failures in logs and progress events.

**3. The Tech Debt:**
- This fallback policy is controller-level only; we still do not distinguish retryable network failures from non-retryable prompt/schema failures at a finer-grained orchestration level.
