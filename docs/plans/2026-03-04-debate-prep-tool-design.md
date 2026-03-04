# Kamertool — AI Debate Preparation Tool

## Purpose

An AI tool that helps Kamerleden and fractiemedewerkers prepare for any topic of debate. It provides historical context, parliamentary records, party positions, and generates suggested questions for ministers.

## Users

- **Kamerleden** — prepare their own debates directly
- **Fractiemedewerkers** — prepare briefings for Kamerleden
- **Journalists/researchers** — neutral mode without party framing
- Output is always tailored for the Kamerlid in the debate

## Architecture: LLM-Agent with Live Tools

Next.js full-stack app. The LLM agent has tools that fetch live data on-demand — no pre-ingestion pipeline, no vector DB.

```
┌─────────────────────────────────────┐
│           Next.js Frontend          │
│  ┌───────────┐  ┌────────────────┐  │
│  │  Chat UI  │  │ Briefing View  │  │
│  └───────────┘  └────────────────┘  │
└──────────────┬──────────────────────┘
               │ API Routes
┌──────────────▼──────────────────────┐
│         LLM Agent Layer             │
│  (pluggable: Claude / GPT / etc.)   │
│                                     │
│  Tools:                             │
│  ├─ search_kamerstukken             │
│  ├─ search_handelingen              │
│  ├─ search_news                     │
│  ├─ search_party_docs               │
│  └─ generate_briefing               │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌───────┐ ┌────────┐
│ TK API │ │ News  │ │ Postgres│
│ (OData)│ │ APIs  │ │        │
└────────┘ └───────┘ └────────┘
```

## Agent Tools

### 1. search_kamerstukken
Queries TK OData API (`gegevensmagazijn.tweedekamer.nl/OData/v4/2.0`):
- Zaak (moties, amendementen, wetsvoorstellen) by topic
- Document content and metadata
- Stemming (voting records) per fractie/persoon
- Vergadering + Agendapunt for scheduling
- Toezegging (ministerial commitments)

### 2. search_handelingen
Searches debate transcripts:
- Previous statements on a topic
- Who said what, which minister responded
- Historical positions and promises

### 3. search_news
Web search scoped to Dutch news:
- NOS, RTVNieuws, Volkskrant, NRC
- Rijksoverheid.nl press releases
- Current context beyond formal records

### 4. search_party_docs
Queries organisation's uploaded documents + pre-loaded party programmes:
- Verkiezingsprogramma (pre-loaded for all parties)
- Custom uploads: coalitieakkoord, interne notities
- Full-text search, scoped to user's organisation

### 5. generate_briefing
Compiles gathered info into structured output:
- Topic summary and context
- Timeline of parliamentary activity
- Key positions per fractie
- Suggested questions for the minister (with sources)
- Export as PDF or markdown

## Party Selection

- **Optional** — users can start without selecting a party
- Pre-loaded party programmes for all current TK parties
- With party selected: agent frames from that party's perspective
- Without party: neutral, balanced context showing all positions
- Can change or clear party mid-session

## User Model & Organisations

- Open access: anyone can chat + generate briefings without account
- Magic link auth for accounts
- Organisations (fracties): shared docs, shared briefing history
- Org admins invite/remove members

### Data Model

```
Party
├── id, name, shortName (e.g. "VVD", "D66")
├── programme (full text verkiezingsprogramma)
└── updatedAt

User
├── id, email, name
├── organisationId (nullable)
├── defaultPartyId (nullable)
└── role (member | admin)

Organisation
├── id, name, slug
└── createdBy

OrgDocument
├── id, organisationId
├── title, content (full text)
└── fileUrl (original upload)

Briefing
├── id, userId, organisationId (nullable)
├── topic, content (markdown)
└── createdAt

ChatSession
├── id, userId
├── topic
└── messages (JSON)
```

## Frontend & UX

### Pages
1. **Home** — Topic input + optional party selector. "Bereid je voor op een debat over..."
2. **Chat** — Conversational interface with inline source citations. Sidebar: party selection + quick actions
3. **Briefing Export** — Structured doc, exportable as PDF/markdown
4. **Organisation Settings** — Manage members, upload docs
5. **Briefing History** — Past briefings, searchable

### UX Details
- Sources always cited with links to official TK documents
- Agent shows tool usage ("Kamerstukken doorzoeken...")
- Dutch language UI
- Desktop-first, responsive

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **PostgreSQL** (Neon or Supabase)
- **Vercel AI SDK** — agent/tool-use, pluggable LLM providers
- **NextAuth.js** — magic link auth
- **Cloudflare R2** — file uploads
- **Vercel** — deployment

### Key Libraries
- `ai` (Vercel AI SDK)
- `next-auth`
- `@react-pdf/renderer` or `jspdf`
- `zod`
