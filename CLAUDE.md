# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Kamertool is an AI-powered debate preparation tool for Dutch parliament (Tweede Kamer) members. It provides a chat interface backed by LLMs with tool-calling access to the Tweede Kamer OData API, news search, party programs, and organisation documents. All UI text is in Dutch.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

**Database migrations:** `npx drizzle-kit push` (uses Supabase PostgreSQL). If the pooler connection fails, use the Supabase MCP `apply_migration` tool directly.

**Deployment:** Auto-deploys from `main` via Vercel Git integration. Push to `main` triggers production deploy.

Live at https://kamer.deltainstituut.nl (also https://kamertool.vercel.app) — GitHub repo: `onno-delta/kamertool`

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (Supabase) · NextAuth v5 (magic link via Resend) · Vercel AI SDK v6

### AI Layer (`lib/ai.ts`)

Multi-provider model factory supporting Anthropic, OpenAI, and Google. `getModel({ model?, apiKey? })` creates a `LanguageModel` — if `apiKey` is provided, creates a fresh provider instance (BYOK); otherwise falls back to env var keys. Default model is `claude-haiku-4-5`. Free-tier users can switch models via the chat toolbar; the selected model key is sent in the request body.

**AI SDK v6 specifics:** Use `maxOutputTokens` (not `maxTokens`), import `LanguageModel` (not `LanguageModelV1`).

### BYOK System (Bring Your Own Key)

Users store their own API keys encrypted with AES-256-GCM (`lib/crypto.ts`). Only one key active per user at a time. Free tier: 10 messages/day tracked in `usage_log` table (`lib/rate-limit.ts`). BYOK users get unlimited usage.

Flow: `lib/user-keys.ts` → `lib/crypto.ts` → `user_api_key` table (encrypted) → `lib/ai.ts` (decrypted at request time)

### AI Tools (`lib/tools/`)

Six tools the LLM can call during chat/briefing generation:
- `search-kamerstukken.ts` — Parliamentary documents via TK OData API
- `search-handelingen.ts` — Debate transcripts via TK OData API
- `search-toezeggingen.ts` — Minister promises
- `search-stemmingen.ts` — Voting results
- `search-news.ts` — News via Serper API
- `search-party-docs.ts` — Party programs + organisation documents from DB

The TK OData API base: `https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0` (wrapper in `lib/tk-api.ts`, 5-minute revalidation cache).

### Auth (`auth.ts`, `middleware.ts`)

NextAuth v5 with Resend (magic link email). Database-backed sessions. Session callback extends with `user.id`, `user.role`, `user.organisationId`, `user.defaultPartyId`. Middleware protects `/dashboard`, `/settings`, and their API routes.

### Database Schema (`lib/db/schema.ts`)

Key tables: `party`, `organisation`, `user`, `briefing`, `chat_session`, `user_api_key`, `usage_log`, `org_document`, plus NextAuth tables (`account`, `session`, `verificationToken`). All IDs are UUIDs. Chat messages stored as JSON text in `chat_session.messages`.

**Database connection (`lib/db/index.ts`):** Uses `postgres.js` with `prepare: false` — required because Supabase's transaction pooler (port 6543) runs PgBouncer which doesn't support prepared statements.

### API Routes

- `/api/chat` — POST, streaming (`streamText`), BYOK + rate limit, accepts `model` from body for free-tier, uses `stepCountIs(10)` max tool calls. Allows unauthenticated access (uses session cookie for rate limiting)
- `/api/briefing` — POST, non-streaming (`generateText`), saves to `briefings` table, `stepCountIs(15)`
- `/api/briefings` — GET, list user's saved briefings with optional `?q=` search
- `/api/settings/keys` — CRUD for encrypted API keys
- `/api/settings/keys/test` — Validates a key by making a minimal LLM call
- `/api/settings/usage` — Current rate limit usage
- `/api/organisations/[id]/members` + `/documents` — Organisation management

Most API routes check auth via `await auth()` and return 401 if missing. Exception: `/api/chat` allows unauthenticated users (free tier with session-based rate limiting).

### Key Components

- `components/chat.tsx` — Main chat UI using `useChat()` from `@ai-sdk/react`
- `components/briefing-dialog.tsx` — Briefing generation modal + PDF export (`@react-pdf/renderer`)
- `components/providers.tsx` — SessionProvider wrapper (required for `useSession()` in client components)

## Environment Variables

```
DATABASE_URL          # Supabase PostgreSQL connection string
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
- Rate limit check in chat/briefing routes: check `getActiveKey()` first; if BYOK skip rate limit, otherwise call `checkAndIncrementUsage()`
- All user-facing text in Dutch
