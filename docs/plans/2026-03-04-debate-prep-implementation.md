# Kamertool — AI Debate Prep Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app that helps Kamerleden prepare for debates using an AI agent with live access to Tweede Kamer data, news, and party programmes.

**Architecture:** Next.js 14 App Router full-stack app. LLM agent (Vercel AI SDK v6) with tool-use calls TK OData API, news search, and party docs on-demand. PostgreSQL via Drizzle ORM. Auth via NextAuth v5 with magic link.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Vercel AI SDK v6, Drizzle ORM, PostgreSQL (Neon), NextAuth v5, Resend, Cloudflare R2, Zod

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `.env.local.example`

**Step 1: Create Next.js project**

```bash
cd /Users/onnoblom/kamertool
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

**Step 2: Install dependencies**

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/react zod
npm install next-auth@beta @auth/drizzle-adapter drizzle-orm postgres resend
npm install @react-pdf/renderer
npm install -D drizzle-kit @types/node
```

**Step 3: Create `.env.local.example`**

Create file `.env.local.example`:
```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Auth
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_TRUST_HOST=true
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@kamertool.nl"

# AI (at least one required)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
AI_PROVIDER="anthropic:claude-sonnet-4-5"

# News search
SERPER_API_KEY="..."
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Database Schema

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`

**Step 1: Create database client**

Create `lib/db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
```

**Step 2: Create full schema**

Create `lib/db/schema.ts`:
```typescript
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core"

// --- Auth tables (required by NextAuth) ---

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").notNull().default("member"),
  organisationId: text("organisationId").references(() => organisations.id),
  defaultPartyId: text("defaultPartyId").references(() => parties.id),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// --- App tables ---

export const parties = pgTable("party", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  shortName: text("shortName").notNull().unique(),
  programme: text("programme").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

export const organisations = pgTable("organisation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdBy: text("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const orgDocuments = pgTable("org_document", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organisationId: text("organisationId").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const briefings = pgTable("briefing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  organisationId: text("organisationId").references(() => organisations.id),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatSessions = pgTable("chat_session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  partyId: text("partyId").references(() => parties.id),
  topic: text("topic"),
  messages: text("messages").notNull().default("[]"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})
```

**Step 3: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 4: Generate and push migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

**Step 5: Commit**

```bash
git add lib/db/ drizzle.config.ts drizzle/
git commit -m "feat: add database schema with Drizzle ORM"
```

---

## Task 3: Authentication

**Files:**
- Create: `auth.ts`, `types/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`

**Step 1: Create type augmentation**

Create `types/next-auth.d.ts`:
```typescript
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      organisationId: string | null
      defaultPartyId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    organisationId: string | null
    defaultPartyId: string | null
  }
}
```

**Step 2: Create auth config**

Create `auth.ts`:
```typescript
import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "noreply@kamertool.nl",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      session.user.organisationId = user.organisationId
      session.user.defaultPartyId = user.defaultPartyId
      return session
    },
  },
})
```

**Step 3: Create route handler**

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

**Step 4: Create middleware**

Create `middleware.ts`:
```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/api/organisations/:path*"],
}
```

**Step 5: Commit**

```bash
git add auth.ts types/ app/api/auth/ middleware.ts
git commit -m "feat: add NextAuth v5 with magic link authentication"
```

---

## Task 4: Party Data Seed

**Files:**
- Create: `lib/parties.ts`, `scripts/seed-parties.ts`

**Step 1: Create party data**

Create `lib/parties.ts` with all current TK parties and placeholder programme text. The programmes will be filled in with real content from party websites.

```typescript
export const PARTIES = [
  { shortName: "VVD", name: "Volkspartij voor Vrijheid en Democratie" },
  { shortName: "D66", name: "Democraten 66" },
  { shortName: "PVV", name: "Partij voor de Vrijheid" },
  { shortName: "CDA", name: "Christen-Democratisch Appèl" },
  { shortName: "SP", name: "Socialistische Partij" },
  { shortName: "PvdA", name: "Partij van de Arbeid" },
  { shortName: "GL", name: "GroenLinks" },
  { shortName: "PvdD", name: "Partij voor de Dieren" },
  { shortName: "CU", name: "ChristenUnie" },
  { shortName: "FVD", name: "Forum voor Democratie" },
  { shortName: "SGP", name: "Staatkundig Gereformeerde Partij" },
  { shortName: "DENK", name: "DENK" },
  { shortName: "Volt", name: "Volt Nederland" },
  { shortName: "BBB", name: "BoerBurgerBeweging" },
  { shortName: "NSC", name: "Nieuw Sociaal Contract" },
  { shortName: "PvdA-GL", name: "GroenLinks-PvdA" },
] as const
```

**Step 2: Create seed script**

Create `scripts/seed-parties.ts`:
```typescript
import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
import { PARTIES } from "@/lib/parties"

async function seed() {
  for (const party of PARTIES) {
    await db.insert(parties).values({
      name: party.name,
      shortName: party.shortName,
      programme: `[Verkiezingsprogramma ${party.shortName} - wordt aangevuld]`,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${PARTIES.length} parties`)
  process.exit(0)
}

seed()
```

Run: `npx tsx scripts/seed-parties.ts`

**Step 3: Commit**

```bash
git add lib/parties.ts scripts/seed-parties.ts
git commit -m "feat: add party data and seed script"
```

---

## Task 5: TK API Client + Agent Tools

**Files:**
- Create: `lib/tk-api.ts`, `lib/tools/search-kamerstukken.ts`, `lib/tools/search-handelingen.ts`, `lib/tools/search-toezeggingen.ts`, `lib/tools/index.ts`

**Step 1: Create TK API client**

Create `lib/tk-api.ts`:
```typescript
const BASE_URL = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0"

export async function queryTK(entity: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    $format: "json",
    ...params,
  })
  const url = `${BASE_URL}/${entity}?${searchParams}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`TK API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.value ?? []
}
```

**Step 2: Create search_kamerstukken tool**

Create `lib/tools/search-kamerstukken.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchKamerstukken = tool({
  description: "Zoek in Kamerstukken, moties, amendementen en wetsvoorstellen van de Tweede Kamer. Gebruik dit om parlementaire geschiedenis en context over een onderwerp te vinden.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm voor het onderwerp, bijv. 'stikstof' of 'woningbouw'"),
    type: z.enum(["Motie", "Amendement", "Wetsvoorstel", "Brief regering", "Schriftelijke vragen", ""])
      .optional()
      .describe("Filter op type Kamerstuk. Laat leeg voor alle types."),
    maxResults: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ query, type, maxResults }) => {
    let filter = `(contains(Onderwerp,'${query}') or contains(Titel,'${query}')) and Verwijderd eq false`
    if (type) filter += ` and Soort eq '${type}'`

    const results = await queryTK("Zaak", {
      $filter: filter,
      $select: "Id,Nummer,Soort,Titel,Onderwerp,Status,GestartOp",
      $orderby: "GestartOp desc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      results: results.map((z: any) => ({
        id: z.Id,
        nummer: z.Nummer,
        type: z.Soort,
        titel: z.Titel,
        onderwerp: z.Onderwerp,
        datum: z.GestartOp,
      })),
    }
  },
})
```

**Step 3: Create search_handelingen tool (debate transcripts)**

Create `lib/tools/search-handelingen.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchHandelingen = tool({
  description: "Zoek in debatten en vergaderingen van de Tweede Kamer. Vindt welke debatten er over een onderwerp zijn gevoerd en wanneer.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm voor het debatonderwerp"),
    maxResults: z.number().int().min(1).max(25).optional().default(10),
  }),
  execute: async ({ query, maxResults }) => {
    // Search via Agendapunt which has Onderwerp field
    const agendapunten = await queryTK("Agendapunt", {
      $filter: `contains(Onderwerp,'${query}') and Verwijderd eq false`,
      $select: "Id,Onderwerp,Nummer,Volgorde,Activiteit_Id",
      $orderby: "GewijzigdOp desc",
      $top: String(maxResults),
    })

    // For each agendapunt, get the parent Activiteit (meeting) details
    const results = []
    for (const ap of agendapunten.slice(0, maxResults)) {
      if (!ap.Activiteit_Id) continue
      const activiteiten = await queryTK(`Activiteit(${ap.Activiteit_Id})`, {
        $select: "Id,Soort,Datum,Onderwerp,Aanvang,Einde",
      }).catch(() => null)

      results.push({
        onderwerp: ap.Onderwerp,
        activiteit: activiteiten ? {
          soort: activiteiten.Soort,
          datum: activiteiten.Datum,
          onderwerp: activiteiten.Onderwerp,
        } : null,
      })
    }

    return { count: results.length, results }
  },
})
```

**Step 4: Create search_toezeggingen tool**

Create `lib/tools/search-toezeggingen.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchToezeggingen = tool({
  description: "Zoek toezeggingen van ministers. Dit zijn beloftes die ministers aan de Kamer hebben gedaan. Erg nuttig om ministers aan te spreken op openstaande toezeggingen.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm in de toezeggingstekst"),
    statusFilter: z.enum(["Openstaand", "Afgedaan", ""])
      .optional()
      .default("Openstaand")
      .describe("Filter op status. 'Openstaand' = nog niet nagekomen, 'Afgedaan' = afgerond."),
    maxResults: z.number().int().min(1).max(25).optional().default(10),
  }),
  execute: async ({ query, statusFilter, maxResults }) => {
    let filter = `contains(Tekst,'${query}') and Verwijderd eq false`
    if (statusFilter) filter += ` and Status eq '${statusFilter}'`

    const results = await queryTK("Toezegging", {
      $filter: filter,
      $select: "Id,Nummer,Tekst,Status,DatumNakoming,Ministerie,Naam,Functie",
      $orderby: "DatumNakoming desc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      results: results.map((t: any) => ({
        nummer: t.Nummer,
        tekst: t.Tekst,
        status: t.Status,
        datumNakoming: t.DatumNakoming,
        ministerie: t.Ministerie,
        minister: t.Naam,
        functie: t.Functie,
      })),
    }
  },
})
```

**Step 5: Create search_stemmingen tool**

Create `lib/tools/search-stemmingen.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchStemmingen = tool({
  description: "Zoek stemmingsuitslagen over moties, amendementen en wetsvoorstellen. Laat zien welke fracties voor of tegen hebben gestemd.",
  inputSchema: z.object({
    zaakId: z.string().describe("Het ID van de Zaak (motie/amendement) om stemmingen voor op te zoeken"),
  }),
  execute: async ({ zaakId }) => {
    const besluiten = await queryTK("Besluit", {
      $filter: `Zaak_Id eq ${zaakId} and StemmingsSoort ne null and Verwijderd eq false`,
      $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
      $expand: "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte)",
    })

    return {
      count: besluiten.length,
      results: besluiten.map((b: any) => ({
        besluit: b.BesluitTekst,
        soort: b.StemmingsSoort,
        stemmingen: (b.Stemming ?? []).map((s: any) => ({
          fractie: s.ActorFractie || s.ActorNaam,
          stem: s.Soort,
          zetels: s.FractieGrootte,
        })),
      })),
    }
  },
})
```

**Step 6: Create tools index**

Create `lib/tools/index.ts`:
```typescript
export { searchKamerstukken } from "./search-kamerstukken"
export { searchHandelingen } from "./search-handelingen"
export { searchToezeggingen } from "./search-toezeggingen"
export { searchStemmingen } from "./search-stemmingen"
```

**Step 7: Commit**

```bash
git add lib/tk-api.ts lib/tools/
git commit -m "feat: add TK OData API client and agent tools"
```

---

## Task 6: News Search Tool

**Files:**
- Create: `lib/tools/search-news.ts`

**Step 1: Create news search tool**

Uses Serper API (Google search API) scoped to Dutch news sources.

Create `lib/tools/search-news.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"

export const searchNews = tool({
  description: "Zoek recent nieuws over een onderwerp. Doorzoekt NOS, RTVNieuws, Volkskrant, NRC en Rijksoverheid.nl voor actuele context.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm voor het nieuwsonderwerp"),
    maxResults: z.number().int().min(1).max(10).optional().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    const res = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "nl",
        hl: "nl",
        num: maxResults,
      }),
    })

    if (!res.ok) return { count: 0, results: [], error: "News search unavailable" }

    const data = await res.json()
    const articles = (data.news ?? []).map((article: any) => ({
      title: article.title,
      snippet: article.snippet,
      source: article.source,
      url: article.link,
      date: article.date,
    }))

    return { count: articles.length, results: articles }
  },
})
```

**Step 2: Export from index**

Add to `lib/tools/index.ts`:
```typescript
export { searchNews } from "./search-news"
```

**Step 3: Commit**

```bash
git add lib/tools/search-news.ts lib/tools/index.ts
git commit -m "feat: add news search tool via Serper API"
```

---

## Task 7: Party Docs Search Tool

**Files:**
- Create: `lib/tools/search-party-docs.ts`

**Step 1: Create party docs tool**

Create `lib/tools/search-party-docs.ts`:
```typescript
import { tool } from "ai"
import { z } from "zod"
import { db } from "@/lib/db"
import { parties, orgDocuments } from "@/lib/db/schema"
import { ilike, or, eq, and, sql } from "drizzle-orm"

export function createSearchPartyDocs(partyId: string | null, organisationId: string | null) {
  return tool({
    description: "Zoek in partijprogramma's en organisatiedocumenten. Vindt standpunten en beleidsstukken van de geselecteerde partij.",
    inputSchema: z.object({
      query: z.string().describe("Zoekterm voor in partijdocumenten en programma's"),
    }),
    execute: async ({ query }) => {
      const results: Array<{ source: string; title: string; excerpt: string }> = []

      // Search party programme
      if (partyId) {
        const party = await db.query.parties.findFirst({
          where: eq(parties.id, partyId),
        })
        if (party && party.programme.toLowerCase().includes(query.toLowerCase())) {
          // Extract relevant section (500 chars around match)
          const idx = party.programme.toLowerCase().indexOf(query.toLowerCase())
          const start = Math.max(0, idx - 250)
          const end = Math.min(party.programme.length, idx + 250)
          results.push({
            source: `Verkiezingsprogramma ${party.shortName}`,
            title: party.name,
            excerpt: party.programme.slice(start, end),
          })
        }
      }

      // Search org documents
      if (organisationId) {
        const docs = await db.select()
          .from(orgDocuments)
          .where(
            and(
              eq(orgDocuments.organisationId, organisationId),
              sql`${orgDocuments.content} ILIKE ${'%' + query + '%'}`
            )
          )
          .limit(5)

        for (const doc of docs) {
          const idx = doc.content.toLowerCase().indexOf(query.toLowerCase())
          const start = Math.max(0, idx - 250)
          const end = Math.min(doc.content.length, idx + 250)
          results.push({
            source: "Organisatiedocument",
            title: doc.title,
            excerpt: doc.content.slice(start, end),
          })
        }
      }

      return { count: results.length, results }
    },
  })
}
```

**Step 2: Export from index**

Add to `lib/tools/index.ts`:
```typescript
export { createSearchPartyDocs } from "./search-party-docs"
```

**Step 3: Commit**

```bash
git add lib/tools/search-party-docs.ts lib/tools/index.ts
git commit -m "feat: add party docs and programme search tool"
```

---

## Task 8: AI Provider Setup

**Files:**
- Create: `lib/ai.ts`

**Step 1: Create pluggable AI provider**

Create `lib/ai.ts`:
```typescript
import { createProviderRegistry } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

export const registry = createProviderRegistry({
  anthropic,
  openai,
})

export function getModel(provider?: string) {
  const modelId = provider || process.env.AI_PROVIDER || "anthropic:claude-sonnet-4-5"
  return registry.languageModel(modelId)
}
```

**Step 2: Commit**

```bash
git add lib/ai.ts
git commit -m "feat: add pluggable AI provider registry"
```

---

## Task 9: Chat API Route

**Files:**
- Create: `app/api/chat/route.ts`, `lib/system-prompt.ts`

**Step 1: Create system prompt builder**

Create `lib/system-prompt.ts`:
```typescript
export function buildSystemPrompt(partyName?: string | null) {
  const base = `Je bent een AI-assistent die Kamerleden helpt bij het voorbereiden van debatten in de Tweede Kamer der Staten-Generaal.

Je hebt toegang tot:
- Kamerstukken, moties, amendementen en wetsvoorstellen (via de Tweede Kamer API)
- Handelingen en debatverslagen
- Toezeggingen van ministers
- Stemmingsuitslagen per fractie
- Recent nieuws
- Partijprogramma's en organisatiedocumenten

Gebruik altijd je tools om actuele informatie op te zoeken. Geef bronnen aan bij je antwoorden. Antwoord in het Nederlands.

Bij het genereren van suggestievragen voor een debat:
- Verwijs naar specifieke Kamerstukken, moties of toezeggingen
- Zoek openstaande toezeggingen waar de minister op aangesproken kan worden
- Gebruik stemmingsuitslagen om politieke verhoudingen te duiden
- Verwijs naar eerdere uitspraken in Handelingen`

  if (partyName) {
    return base + `\n\nDe gebruiker vertegenwoordigt ${partyName}. Frame je suggesties en analyse vanuit het perspectief van deze partij. Verwijs waar relevant naar hun verkiezingsprogramma.`
  }

  return base + `\n\nDe gebruiker heeft geen partij geselecteerd. Geef neutrale, gebalanceerde context. Toon standpunten van alle relevante fracties zonder partij te kiezen.`
}
```

**Step 2: Create chat API route**

Create `app/api/chat/route.ts`:
```typescript
import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
} from "@/lib/tools"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, partyId, partyName, organisationId } = await req.json()

  const result = streamText({
    model: getModel(),
    system: buildSystemPrompt(partyName),
    messages,
    stopWhen: stepCountIs(10),
    tools: {
      searchKamerstukken,
      searchHandelingen,
      searchToezeggingen,
      searchStemmingen,
      searchNews,
      searchPartyDocs: createSearchPartyDocs(partyId ?? null, organisationId ?? null),
    },
  })

  return result.toUIMessageStreamResponse()
}
```

**Step 3: Commit**

```bash
git add app/api/chat/route.ts lib/system-prompt.ts
git commit -m "feat: add AI chat API route with all agent tools"
```

---

## Task 10: Parties API

**Files:**
- Create: `app/api/parties/route.ts`

**Step 1: Create parties endpoint**

Create `app/api/parties/route.ts`:
```typescript
import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  const allParties = await db
    .select({ id: parties.id, name: parties.name, shortName: parties.shortName })
    .from(parties)
    .orderBy(parties.shortName)

  return NextResponse.json(allParties)
}
```

**Step 2: Commit**

```bash
git add app/api/parties/route.ts
git commit -m "feat: add parties API endpoint"
```

---

## Task 11: Chat UI

**Files:**
- Create: `app/page.tsx`, `components/chat.tsx`, `components/party-selector.tsx`, `components/message.tsx`

**Step 1: Create party selector component**

Create `components/party-selector.tsx`:
```tsx
"use client"

import { useEffect, useState } from "react"

type Party = { id: string; name: string; shortName: string }

export function PartySelector({
  value,
  onChange,
}: {
  value: Party | null
  onChange: (party: Party | null) => void
}) {
  const [parties, setParties] = useState<Party[]>([])

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
  }, [])

  return (
    <select
      value={value?.id ?? ""}
      onChange={(e) => {
        const party = parties.find((p) => p.id === e.target.value) ?? null
        onChange(party)
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
    >
      <option value="">Geen partij (neutraal)</option>
      {parties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.shortName} — {p.name}
        </option>
      ))}
    </select>
  )
}
```

**Step 2: Create message component**

Create `components/message.tsx`:
```tsx
type MessageProps = {
  role: "user" | "assistant"
  content: string
  toolInvocations?: any[]
}

export function Message({ role, content, toolInvocations }: MessageProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {toolInvocations?.map((invocation: any, i: number) => (
          <div key={i} className="mb-2 text-xs text-gray-500 italic">
            {invocation.state === "call" && `Zoeken: ${invocation.toolName}...`}
            {invocation.state === "result" && `✓ ${invocation.toolName}`}
          </div>
        ))}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  )
}
```

**Step 3: Create chat component**

Create `components/chat.tsx`:
```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { useState } from "react"
import { PartySelector } from "./party-selector"
import { Message } from "./message"

type Party = { id: string; name: string; shortName: string }

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      partyId: party?.id,
      partyName: party?.shortName,
    },
  })

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Kamertool</h1>
        <PartySelector value={party} onChange={setParty} />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">
                Bereid je voor op een debat
              </h2>
              <p className="mt-2 text-gray-500">
                Stel een vraag over een onderwerp en ik zoek de relevante Kamerstukken,
                debatten en toezeggingen voor je op.
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Message
            key={m.id}
            role={m.role as "user" | "assistant"}
            content={m.content}
            toolInvocations={(m as any).toolInvocations}
          />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t px-6 py-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Bijv. 'Bereid me voor op het stikstofdebat' of 'Welke toezeggingen staan nog open over woningbouw?'"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Bezig..." : "Verstuur"}
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 4: Update home page**

Replace `app/page.tsx`:
```tsx
import { Chat } from "@/components/chat"

export default function Home() {
  return <Chat />
}
```

**Step 5: Commit**

```bash
git add components/ app/page.tsx
git commit -m "feat: add chat UI with party selector"
```

---

## Task 12: Briefing Generation API

**Files:**
- Create: `app/api/briefing/route.ts`

**Step 1: Create briefing endpoint**

Create `app/api/briefing/route.ts`:
```typescript
import { generateText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
} from "@/lib/tools"
import { NextResponse } from "next/server"

export const maxDuration = 120

export async function POST(req: Request) {
  const { topic, partyId, partyName, organisationId, chatHistory } = await req.json()

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const prompt = `Genereer een uitgebreide debriefing over het onderwerp: "${topic}"

Structuur:
## Samenvatting
Korte samenvatting van het onderwerp en de huidige stand van zaken.

## Parlementaire Geschiedenis
Tijdlijn van relevante Kamerstukken, moties en amendementen.

## Standpunten per Fractie
Overzicht van posities van de verschillende fracties op basis van stemmingen en uitspraken.

## Openstaande Toezeggingen
Toezeggingen van ministers die nog niet zijn nagekomen.

## Suggestievragen voor het Debat
Concrete vragen om aan de minister te stellen, met verwijzing naar bronnen.

${partyName ? `Frame alles vanuit het perspectief van ${partyName}.` : "Geef een neutraal, gebalanceerd overzicht."}

Gebruik je tools om actuele informatie op te zoeken. Verwijs altijd naar bronnen.`

  const { text } = await generateText({
    model: getModel(),
    system: `Je bent een parlementair onderzoeksassistent die debatbriefings schrijft voor Kamerleden. Gebruik altijd je tools om informatie op te zoeken. Schrijf in het Nederlands. Verwijs naar specifieke Kamerstuknummers.`,
    prompt,
    stopWhen: stepCountIs(15),
    tools: {
      searchKamerstukken,
      searchHandelingen,
      searchToezeggingen,
      searchStemmingen,
      searchNews,
      searchPartyDocs: createSearchPartyDocs(partyId ?? null, organisationId ?? null),
    },
  })

  return NextResponse.json({ topic, content: text })
}
```

**Step 2: Commit**

```bash
git add app/api/briefing/route.ts
git commit -m "feat: add briefing generation API endpoint"
```

---

## Task 13: Briefing Export UI

**Files:**
- Create: `components/briefing-dialog.tsx`, update `components/chat.tsx`

**Step 1: Create briefing dialog**

Create `components/briefing-dialog.tsx`:
```tsx
"use client"

import { useState } from "react"

type Props = {
  topic: string
  partyId?: string | null
  partyName?: string | null
  organisationId?: string | null
  onClose: () => void
}

export function BriefingDialog({ topic, partyId, partyName, organisationId, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useState(() => {
    fetch("/api/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, partyId, partyName, organisationId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content)
        setLoading(false)
      })
      .catch(() => {
        setError("Kon briefing niet genereren")
        setLoading(false)
      })
  })

  const handleCopyMarkdown = () => {
    if (content) navigator.clipboard.writeText(content)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Debatbriefing: {topic}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={!content}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Kopieer markdown
            </button>
            <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              Sluiten
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 64px)" }}>
          {loading && <p className="text-gray-500">Briefing wordt gegenereerd...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {content && (
            <div className="prose max-w-none whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Add briefing button to chat**

Update `components/chat.tsx` — add a "Genereer briefing" button in the header and state for the dialog. (Modify the existing header to include the button, import and render `BriefingDialog` when active.)

**Step 3: Commit**

```bash
git add components/briefing-dialog.tsx components/chat.tsx
git commit -m "feat: add briefing generation dialog with markdown export"
```

---

## Task 14: Login Page

**Files:**
- Create: `app/login/page.tsx`, `app/login/verify/page.tsx`

**Step 1: Create login page**

Create `app/login/page.tsx`:
```tsx
import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-900">Inloggen</h1>
        <p className="mt-2 text-sm text-gray-500">
          Je ontvangt een magic link via e-mail.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server"
            await signIn("resend", {
              email: formData.get("email"),
              redirectTo: "/",
            })
          }}
          className="mt-6"
        >
          <input
            type="email"
            name="email"
            placeholder="je@email.nl"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
          >
            Verstuur magic link
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Create verify page**

Create `app/login/verify/page.tsx`:
```tsx
export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-900">Check je e-mail</h1>
        <p className="mt-2 text-gray-500">
          We hebben een magic link verstuurd. Klik op de link in je e-mail om in te loggen.
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/login/
git commit -m "feat: add login and email verification pages"
```

---

## Task 15: Organisation Management

**Files:**
- Create: `app/api/organisations/route.ts`, `app/api/organisations/[id]/members/route.ts`, `app/api/organisations/[id]/documents/route.ts`

**Step 1: Create organisations CRUD**

Create `app/api/organisations/route.ts`:
```typescript
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { organisations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, slug } = await req.json()

  const org = await db.insert(organisations).values({
    name,
    slug,
    createdBy: session.user.id,
  }).returning()

  // Make creator admin of the org
  await db.update(users).set({
    organisationId: org[0].id,
    role: "admin",
  }).where(eq(users.id, session.user.id))

  return NextResponse.json(org[0])
}
```

**Step 2: Create members endpoint**

Create `app/api/organisations/[id]/members/route.ts`:
```typescript
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.organisationId !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const members = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.organisationId, params.id))

  return NextResponse.json(members)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.organisationId !== params.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email } = await req.json()
  const user = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await db.update(users).set({ organisationId: params.id }).where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}
```

**Step 3: Create documents endpoint**

Create `app/api/organisations/[id]/documents/route.ts`:
```typescript
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { orgDocuments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.organisationId !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const docs = await db
    .select({ id: orgDocuments.id, title: orgDocuments.title, createdAt: orgDocuments.createdAt })
    .from(orgDocuments)
    .where(eq(orgDocuments.organisationId, params.id))

  return NextResponse.json(docs)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.organisationId !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content } = await req.json()

  const doc = await db.insert(orgDocuments).values({
    organisationId: params.id,
    title,
    content,
  }).returning()

  return NextResponse.json(doc[0])
}
```

**Step 4: Commit**

```bash
git add app/api/organisations/
git commit -m "feat: add organisation management API endpoints"
```

---

## Task 16: Layout and Navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/nav.tsx`

**Step 1: Create navigation component**

Create `components/nav.tsx`:
```tsx
import { auth } from "@/auth"
import Link from "next/link"

export async function Nav() {
  const session = await auth()

  return (
    <nav className="flex items-center gap-4">
      {session ? (
        <>
          <span className="text-sm text-gray-500">{session.user.email}</span>
          {session.user.organisationId && (
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              Organisatie
            </Link>
          )}
        </>
      ) : (
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Inloggen
        </Link>
      )}
    </nav>
  )
}
```

**Step 2: Update layout**

Update `app/layout.tsx` to include global styles, Inter font, and metadata with Dutch title/description.

**Step 3: Commit**

```bash
git add app/layout.tsx components/nav.tsx
git commit -m "feat: add navigation and layout"
```

---

## Task 17: GitHub Repo + Deploy

**Step 1: Create GitHub repo under onno-delta**

```bash
cd /Users/onnoblom/kamertool
gh auth switch --user onno-delta
gh repo create onno-delta/kamertool --private --source=. --push
```

**Step 2: Set up Vercel project**

Connect the `onno-delta/kamertool` repo to Vercel. Add environment variables in Vercel dashboard.

**Step 3: Verify deployment**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit any build fixes**

```bash
git add -A
git commit -m "fix: resolve any build issues"
git push
```
