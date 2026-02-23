# Agent Suite

AI agents that work like elite employees: marketing, sales, engineering, and finance agents that onboard themselves, accept OKRs, push back on unreasonable goals, and report progress.

## Stack

- **Next.js 16** (App Router), **TypeScript**, **Tailwind**, **shadcn/ui**
- **Clerk** (auth + orgs), **Prisma** (PostgreSQL), **Anthropic Claude**, **BullMQ** (Redis), **Stripe** (Phase 3)

## Setup

1. **Clone and install**

   ```bash
   cd agent-suite && npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – PostgreSQL (e.g. Supabase or Neon)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` – from [Clerk](https://dashboard.clerk.com)
   - `ANTHROPIC_API_KEY` – from Anthropic
   - Optional: `REDIS_URL` for BullMQ (Phase 2+)

3. **Database**

   ```bash
   npx prisma migrate dev
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up (Clerk), complete onboarding (company URL → ICP form), add a Marketing agent, and chat. The agent can use **content_generator** and **web_scraper** tools in conversation.

## Phase 1

- Auth (Clerk, org-scoped)
- Organization onboarding (URL scrape + ICP form)
- Agent CRUD and Marketing agent type
- Agent chat with Claude and tool use (content_generator, web_scraper)
- Engine and tools are framework-agnostic (no Next.js in `src/engine/`, `src/tools/`, `src/agents/`)

## Phase 2 (current)

- **OKRs**: Propose OKR → agent evaluates (feasibility, feedback, counter-proposal) via `engine/negotiator.ts`; accept or revise. APIs: `GET/POST .../okrs`, `PATCH .../okrs/:id`, `POST .../okrs/:id/accept`. OKR list and propose form in UI.
- **Tasks**: Task CRUD APIs; `engine/planner.ts` breaks OKRs into tasks; `engine/executor.ts` creates tasks for accepted OKRs (idempotent). Tasks list UI.
- **Agent executor**: `POST .../agents/:id/run` triggers one cycle. Optional BullMQ worker: `src/workers/agent-executor.worker.ts` (run with `npx tsx scripts/run-agent-worker.ts`; requires Redis).
- **Daily reports**: `engine/reporter.ts` generates summary, OKR progress, blockers; `GET/POST .../reports`, `GET/POST .../reports/:date`. Reports list and “Generate today” in UI.

## Project layout

- `src/app/(auth)` – sign-in/sign-up
- `src/app/(dashboard)` – onboarding, agents, agent chat, billing, settings
- `src/app/api/v1/` – versioned REST (orgs, agents, messages)
- `src/engine/` – context builder, conversation handler (no Next.js)
- `src/agents/` – agent type definitions (Marketing) and registry
- `src/tools/` – tool implementations and registry
- `src/lib/` – db, auth, validation (Zod)

## API (Phase 1)

- `GET /api/v1/orgs/current` – current user and org
- `GET/PATCH /api/v1/orgs/:orgId` – get/update org
- `GET/POST /api/v1/orgs/:orgId/agents` – list/create agents
- `GET/PATCH/DELETE /api/v1/orgs/:orgId/agents/:agentId` – agent CRUD
- `GET /api/v1/orgs/:orgId/agents/:agentId/messages` – list messages
- `POST /api/v1/orgs/:orgId/agents/:agentId/message` – send message (runs conversation turn with optional tool use)

All mutations are validated with Zod. Use session auth (Clerk); API keys are planned for Phase 4.
