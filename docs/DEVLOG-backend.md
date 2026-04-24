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
