# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Kamertool is an AI-powered debate preparation tool for Dutch parliament (Tweede Kamer) members. It provides a chat interface backed by LLMs with tool-calling access to parliamentary APIs, news search, party programs, and organisation documents. All UI text is in Dutch.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

**Database migrations:** `npx drizzle-kit push` (uses Supabase PostgreSQL). If the pooler connection fails, use the Supabase MCP `apply_migration` tool directly.

**Scripts** (require `set -a && source .env.local && set +a` before running):
- `npx tsx scripts/seed-parties.ts` — Insert base party rows
- `npx tsx scripts/seed-party-programmes.ts` — Upsert party programme content from `data/partijstandpunten.md`

**Deployment:** Auto-deploys from `main` via Vercel Git integration. Push to `main` triggers production deploy.

Live at https://kamer.deltainstituut.nl (also https://kamertool.vercel.app) — GitHub repo: `onno-delta/kamertool`

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (Supabase) · NextAuth v5 (magic link via Resend) · Vercel AI SDK v6

### AI Layer (`lib/ai.ts`)

Multi-provider model factory supporting Anthropic, OpenAI, and Google. `getModel({ model?, apiKey? })` creates a `LanguageModel` — if `apiKey` is provided, creates a fresh provider instance (BYOK); otherwise falls back to env var keys. Default model is `claude-sonnet-4-5`. Free-tier users can switch models via the chat toolbar; the selected model key is sent in the request body.

**AI SDK v6 specifics:** Use `maxOutputTokens` (not `maxTokens`), import `LanguageModel` (not `LanguageModelV1`).

### BYOK System (Bring Your Own Key)

Users store their own API keys encrypted with AES-256-GCM (`lib/crypto.ts`). Only one key active per user at a time. Free tier: 10 messages/day tracked in `usage_log` table (`lib/rate-limit.ts`). BYOK users get unlimited usage. Whitelisted domains (`tweedekamer.nl`, `deltainstituut.nl`, `herprogrammeerdeoverheid.nl`) get unlimited free-tier access.

Flow: `lib/user-keys.ts` → `lib/crypto.ts` → `user_api_key` table (encrypted) → `lib/ai.ts` (decrypted at request time)

### AI Tools (`lib/tools/`)

Eleven tools the LLM can call during chat/briefing generation:
- `search-opentk.ts` — **Primary search**: full-text search over all parliamentary documents via OpenTK (`berthub.eu/tkconv`). Supports AND/OR/NOT, NEAR(), exact phrases. Also exports `getOpenTKDocument` (fetch full document text by nummer) and `getRecenteKamervragen` (recent written questions).
- `search-kamerstukken.ts` — Parliamentary documents via TK OData API
- `search-documenten.ts` — Letters, notes, reports via TK OData API
- `search-handelingen.ts` — Debate transcripts via TK OData API
- `search-toezeggingen.ts` — Minister promises via TK OData API
- `search-stemmingen.ts` — Voting results via TK OData API
- `search-agenda.ts` — Upcoming debates and committee meetings via TK OData API
- `search-news.ts` — News via Serper API
- `search-party-docs.ts` — Party programmes + organisation documents from DB (ILIKE search)
- `fetch-webpage.ts` — Fetch and extract text from any URL

The TK OData API base: `https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0` (wrapper in `lib/tk-api.ts`, 5-minute revalidation cache).

### Two AI Endpoints with Different Protocols

**`/api/chat`** — Uses AI SDK's `streamText` → `toUIMessageStreamResponse()`. Consumed by `useChat()` hook in `components/chat.tsx`. Max 10 tool-calling steps.

**`/api/briefing`** — Uses AI SDK's `streamText` but with a **custom NDJSON streaming protocol**: iterates `result.fullStream`, emits `{type:"tool-start"}`, `{type:"tool-done"}`, and `{type:"done", content}` as newline-delimited JSON. Saves final content to `briefings` table. Max 25 tool-calling steps. Has its own system prompt (different from chat). Consumed by `components/briefing-context.tsx`.

### Meeting Skills (`lib/meeting-skills.ts`)

Per-meeting-type prompt templates (13 types: Plenair debat, Commissiedebat, Wetgevingsoverleg, etc.) that get injected into the briefing system prompt. Users can customize these per meeting type via `/instructies` (stored in `user_meeting_skill` table). The briefing route resolves: user override > default skill > empty.

### Party Data

- `lib/parties.ts` — Static list of 13 parties (used for UI dropdowns, validation)
- `lib/dossiers.ts` — 19 policy dossier definitions
- `data/partijstandpunten.md` — Structured party profiles with ideological profiles and positions per dossier. Seeded into `party.programme` field via `scripts/seed-party-programmes.ts`.
- `lib/system-prompt.ts` — Builds the chat system prompt; adds party-specific instructions when a party is selected

### Auth (`auth.ts`, `middleware.ts`)

NextAuth v5 with Resend (magic link email). Database-backed sessions. Session callback extends with `user.id`, `user.role`, `user.organisationId`, `user.defaultPartyId`. Middleware protects `/dashboard`, `/settings`, `/instructies`, and their API routes.

### Database Schema (`lib/db/schema.ts`)

Key tables: `party`, `organisation`, `user`, `briefing`, `chat_session`, `user_api_key`, `usage_log`, `org_document`, `user_dossier`, `user_kamerlid`, `user_meeting_skill`, plus NextAuth tables (`account`, `session`, `verificationToken`). All IDs are UUIDs. Chat messages stored as JSON text in `chat_session.messages`.

**Database connection (`lib/db/index.ts`):** Uses `postgres.js` with `prepare: false` — required because Supabase's transaction pooler (port 6543) runs PgBouncer which doesn't support prepared statements.

### Pages

- `/` — Main chat interface (`components/chat.tsx` with `useChat()`)
- `/agenda` — Kameragenda browser (fetches from `/api/agenda`, links to `/voorbereiden`)
- `/voorbereiden` — Briefing generation page (receives `?topic=` and `?soort=` from agenda)
- `/briefings` — Saved briefing history with search
- `/settings` — API key management, usage stats
- `/instructies` — Meeting skill customization (per meeting type prompt editing)
- `/dashboard` — Organisation management
- `/login` — Magic link auth flow

### API Routes

- `/api/chat` — POST, streaming, BYOK + rate limit, allows unauthenticated access
- `/api/briefing` — POST, NDJSON streaming, BYOK + rate limit, saves to DB
- `/api/briefings` — GET, list user's saved briefings with optional `?q=` search
- `/api/agenda` — GET, proxies TK OData agenda with date range params
- `/api/parties` — GET, list all parties from DB
- `/api/kamerleden` — GET, search Kamerleden via TK OData API
- `/api/settings/keys` — GET/POST for encrypted API keys
- `/api/settings/keys/[id]` — DELETE specific key
- `/api/settings/keys/test` — POST, validates a key by making a minimal LLM call
- `/api/settings/usage` — GET, current rate limit usage
- `/api/settings/preferences` — GET/POST, user preferences (meeting skills, selected kamerleden, dossiers)
- `/api/organisations` — POST, create organisation
- `/api/organisations/[id]/members` + `/documents` — Organisation management

### Key Components

- `components/chat.tsx` — Main chat UI using `useChat()` from `@ai-sdk/react`
- `components/briefing-dialog.tsx` — Briefing generation modal + PDF export (`@react-pdf/renderer`)
- `components/briefing-context.tsx` — React context for briefing state, manages NDJSON stream consumption
- `components/progress-sidebar.tsx` — Shows tool-calling progress during briefing generation
- `components/providers.tsx` — SessionProvider wrapper (required for `useSession()` in client components)
- `components/party-selector.tsx` — Party/kamerlid/dossier selection UI

## Environment Variables

```
DATABASE_URL          # Supabase PostgreSQL connection string (port 6543 for pooler)
AUTH_SECRET           # NextAuth secret (openssl rand -base64 32)
AUTH_TRUST_HOST=true
AUTH_RESEND_KEY       # Resend API key for magic link emails
EMAIL_FROM            # Sender email address
ANTHROPIC_API_KEY     # Default Anthropic key (free tier fallback)
OPENAI_API_KEY        # Optional: OpenAI fallback
GOOGLE_GENERATIVE_AI_API_KEY  # Optional: Google fallback
SERPER_API_KEY        # Google Serper for news search
ENCRYPTION_KEY        # 64-char hex for AES-256-GCM (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

## Patterns to Follow

- API route auth pattern: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })`
- When filtering by userId AND another condition in Drizzle, always use `and()` — never chain `.where()` calls on `.$dynamic()` queries (second `.where()` replaces the first)
- Rate limit check in chat/briefing routes: check `getActiveKey()` first; if BYOK skip rate limit, then check `isUnlimitedEmail()`, otherwise call `checkAndIncrementUsage()`
- All user-facing text in Dutch
- Tool descriptions in Dutch (they're shown to the LLM in the system prompt context)
- `searchOpenTK` is the primary search tool — the system prompt and briefing prompt both instruct the LLM to use it first, then fall back to TK OData tools for structured queries
