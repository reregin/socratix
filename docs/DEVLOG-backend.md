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
