# Socratix: Production Roadmap & Team Distribution

While the current Proof-of-Concept (POC) successfully validates the core **Multi-Agent Socratic Pipeline** and dynamic visualization features, transitioning to the "Real Product" (v1.0) requires significant architectural scaling, persistent data storage, and enterprise-grade security.

This document outlines the vision for the real product and assigns clear responsibilities to the 5-person IT engineering team.

---

## 1. Vision: The "Real Product" Architecture

The POC validates the pipeline using fullstack Next.js. For production, we split into **two independent services** to isolate dependencies and allow FE/BE to develop and deploy independently without risking dependency conflicts.

### Architecture: Next.js (Frontend) + NestJS (Backend)

```text
┌──────────────────────┐       SSE / REST        ┌──────────────────────────┐
│   Next.js (Frontend) │ ◄───────────────────────►│    NestJS (Backend API)  │
│                      │                          │                          │
│  • React UI          │                          │  • Multi-Agent Pipeline  │
│  • useChat + SSE     │                          │  • Validator             │
│  • VisualizationCanvas│                         │  • State Manager         │
│  • Auth (NextAuth)   │                          │  • Gemini API calls      │
│  • Teacher Dashboard │                          │  • PostgreSQL + Redis    │
└──────────────────────┘                          └──────────────────────────┘
```

> **Why the split?** With separate `package.json` files, the FE and BE never crash each other's dependencies. The BE engineer can upgrade `nerdamer` or `@ai-sdk/google` without breaking React. The FE engineer can upgrade Next.js without touching the pipeline.

#### Target Repository Structure (Monorepo)

```text
socratix/
├── apps/
│   ├── frontend/                 # Next.js 15 App
│   │   ├── src/
│   │   │   ├── app/              # Routes & Pages
│   │   │   ├── components/       # Chat UI, Visualization Canvas, Teacher Dashboard
│   │   │   └── lib/              # Auth configuration, UI utilities
│   │   ├── package.json          # React, Tailwind, Framer Motion, NextAuth
│   │   └── ...
│   │
│   └── backend/                  # NestJS App
│       ├── src/
│       │   ├── agents/           # P1/P2/P3: Router, Planner, Visualizer, Prompt Builder
│       │   ├── services/         # BE/P2: Validator, State Manager
│       │   ├── chat/             # P3: SSE Controller for streaming AI SDK messages
│       │   ├── db/               # BE: Supabase/PostgreSQL schema & Redis connections
│       │   └── main.ts           # NestJS Entrypoint
│       ├── package.json          # NestJS, @ai-sdk/google, Math.js, Prisma/TypeORM
│       └── ...
│
├── packages/                     # Shared libraries (optional)
│   ├── shared-types/             # TS interfaces (e.g., Zod schemas for Scene Descriptor)
│   └── eslint-config/            
└── package.json                  # Turborepo/Workspace config
```

### Key Upgrades for v1.0
1. **Service Separation:** Split the monolithic Next.js app into a Next.js frontend and a NestJS backend API, communicating via Server-Sent Events (SSE) for streaming and REST for non-streaming endpoints.
2. **Persistent State Management:** Moving from in-memory `Map` to PostgreSQL (Supabase) + Redis for session state.
3. **Robust Mathematical Validation:** Replacing naive `nerdamer-prime` string hacks with a robust AST parser (Math.js).
4. **Authentication & User Management:** NextAuth.js on the frontend with JWT verification on the NestJS backend.
5. **Responsive Frontend:** Fully responsive, mobile-first SVG/Canvas visualization.
6. **Observability & Analytics:** LLM telemetry, latency monitoring, and pipeline error tracing.

### Production Technology Stack

| Layer | Technology | Service | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (React 19) | Frontend | App routing, SSR, and UI delivery. |
| **Backend Framework** | NestJS | Backend | API controllers, DI, modules, and pipeline orchestration. |
| **AI Client SDK** | Vercel AI SDK (v6) | Frontend | `useChat` hook with SSE transport for streaming. |
| **AI Server SDK** | `@ai-sdk/google` + `ai` | Backend | Gemini API calls, `streamText`, structured generation. |
| **Generative Models** | Gemini 2.0 Flash / Flash-Lite | Backend | Multi-agent dialogue, extraction, and scene generation. |
| **Math Engine** | Custom AST Parser / Math.js | Backend | Deterministic algebraic equation validation. |
| **Database** | PostgreSQL (Supabase/Neon) | Backend | Users, chat histories, and learning analytics. |
| **State / Caching** | Redis | Backend | Ephemeral session state and cache bypass. |
| **Authentication** | NextAuth.js + JWT | Both | Auth on frontend, token verification on backend. |
| **Styling & Animation** | Vanilla CSS + Framer Motion | Frontend | Mobile-responsive design and SVG animations. |
| **Observability** | Datadog / Vercel Analytics | Both | Telemetry, latency monitoring, error tracing. |

---

## 2. Team Distribution (5-Person IT Team)

The core of Socratix is the Multi-Agent Pipeline — 3 engineers are dedicated to the agents, while 1 frontend engineer handles the UI/Visualization and 1 backend engineer handles state persistence and validation infrastructure.

### Pipeline Team (3 Engineers)

#### P1 — Intent & Extraction Engineer (Agent #0 + Agent #1)
**Focus:** Router and Planner
- Owns `router.ts` (Agent #0): classifies user intent (attempting to answer, conceptual help, just chatting, new problem) and determines Planner ON/OFF and Validator ON/OFF flags.
- Owns `planner.ts` (Agent #1): builds context memory, classifies problem type (arithmetic, algebra, geometry, statistics), and extracts the equation from the student's message.
- Manages the Zod schemas that enforce structured JSON output from Gemini Flash-Lite.
- Writes unit tests for routing accuracy and planner extraction quality.

#### P2 — Prompt & Response Engineer (Agent #2 + Agent #3)
**Focus:** Prompt Builder and Response Generator
- Owns `prompt-builder.ts` (Agent #2): assembles the system prompt based on previous pipeline steps (e.g., *"Act as Socratic Tutor. The student is solving {3x+5=14}. They mistakenly think the answer is {9}..."*).
- Owns `response-generator.ts` (Agent #3): generates the streamed Socratic chat response via Gemini 2.0 Flash based on the assembled prompt.
- Responsible for prompt engineering, Socratic questioning strategy, tone control, and preventing answer leakage.
- Optimizes token usage and response latency.

#### P3 — Visualization & Streaming Engineer (Agent #4)
**Focus:** Dynamic Visualizer and NestJS Streaming Controller
- Owns `visualizer.ts` (Agent #4): generates scene coordinates and component descriptors based on the current state and problem type, calling prebuilt SVG elements.
- Owns the NestJS streaming controller: implements the SSE endpoint that streams text tokens, scene data, and debug info to the Next.js frontend using the [UI Message Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol).
- Designs richer scene descriptor schemas for more complex, responsive visualizations.
- Coordinates with FE to ensure the `useChat` SSE transport correctly consumes the backend stream.

---

### Frontend Engineer (1 Engineer)
**Focus:** Next.js Frontend — Visualization Renderer + UI
- Owns the Next.js frontend repo: layout (`page.tsx`), all components in `src/components/`, and styling.
- Owns the `VisualizationCanvas` (Frontend Visualization Renderer): renders visualizations based on Agent #4's scene descriptor result.
- Configures the `useChat` hook with SSE transport pointing to the NestJS backend API.
- Implements user authentication via NextAuth.js (student login, teacher roles).
- Builds the Teacher Dashboard for viewing student progress, session logs, and analytics.

### Backend & Infrastructure Engineer (1 Engineer)
**Focus:** NestJS Backend — State Manager + Validator + Data Persistence
- Owns the NestJS backend repo setup: module structure, dependency injection, and configuration.
- Owns `state-manager` (Backend State Manager): migrates from in-memory `Map` to PostgreSQL (Supabase) and Redis for persistent session state (UID, equation, problem type, next state).
- Owns `validator` (Backend Validator): deterministic math validation (e.g., `3(3) + 5 = 14` → incorrect). Replaces naive `nerdamer` usage with a robust AST parser (Math.js).
- Implements the Redis caching layer for matching cache bypass (as shown in the diagram).
- Configures CI/CD pipelines for both repos, environment management, and deployment settings.
- Integrates observability tooling (logging, telemetry, rate-limiting) on the NestJS API.

---

## 3. Immediate Next Steps for the Team
- **All:** Read the `DEVLOG.md` and run through the `TEST_CASES.md` locally to understand the POC baseline.
- **P1 (Router/Planner):** Audit the current intent classification regex and planner Zod schemas for edge cases.
- **P2 (Prompt/Response):** Review the prompt templates and identify accuracy gaps in Socratic questioning.
- **P3 (Visualizer/Streaming):** Verify the AI SDK v6 streaming layer works end-to-end with `npm run dev`.
- **FE:** Audit the current CSS for mobile breakpoints and begin auth provider research (NextAuth vs Clerk).
- **BE:** Provision the Supabase/Redis instances, draft the database schema, and research Math.js as an AST replacement.