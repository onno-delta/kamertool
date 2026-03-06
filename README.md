# Kamertool

AI-gestuurde debatvoorbereidingstool voor de Tweede Kamer. Kamertool biedt een chatinterface en briefinggeneratie, aangedreven door grote taalmodel(len) met toegang tot parlementaire API’s, nieuws, partijprogramma’s en organisatiedocumenten.

**Live:** [kamer.deltainstituut.nl](https://kamer.deltainstituut.nl) · [kamertool.vercel.app](https://kamertool.vercel.app)

---

## Wat doet Kamertool?

- **Chat** — Vraag stellen over Kamerstukken, debatten, stemmingen, toezeggingen, agenda en nieuws. De AI zoekt in Overheid.nl en de TK OData-API’s en geeft antwoorden met bronverwijzingen.
- **Briefings** — Genereer debatbriefings op basis van een onderwerp (en optioneel vergadertype). De briefing wordt opgeslagen en als PDF gedownload.
- **Agenda** — Blader door de Kameragenda en start direct een briefing voor een gepland debat.
- **Instellingen** — Eigen API-key (BYOK), partij/Kamerleden/dossiers, en instructies per vergadertype.

Alle gebruikersinterface-tekst is in het Nederlands. Zie [docs/HANDLEIDING.md](docs/HANDLEIDING.md) voor de gebruikershandleiding.

---

## Tech stack

| Laag | Technologie |
|------|-------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API routes, Vercel AI SDK v6 |
| Database | PostgreSQL (Supabase), Drizzle ORM |
| Auth | NextAuth v5 (magic link via Resend) |
| Deploy | Vercel (auto-deploy van `main`) |

---

## Ontwikkelomgeving

### Vereisten

- Node.js 18+
- PostgreSQL (lokaal of Supabase)

### Installatie

```bash
git clone https://github.com/onno-delta/kamertool.git
cd kamertool
npm install
```

### Omgevingsvariabelen

Maak `.env.local` aan (zie `.env.example` indien aanwezig). Minimale set:

```env
DATABASE_URL=postgresql://...   # Supabase: gebruik pooler (poort 6543)
AUTH_SECRET=...                 # openssl rand -base64 32
AUTH_TRUST_HOST=true
AUTH_RESEND_KEY=...             # Resend API key (magic link)
EMAIL_FROM=noreply@jouwdomein.nl

# Fallback voor gratis tier (10 berichten/dag zonder eigen key)
ANTHROPIC_API_KEY=sk-ant-...

# Optioneel
OPENAI_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
SERPER_API_KEY=...              # Nieuwszoekopdrachten
ENCRYPTION_KEY=...              # 64 hex chars, voor BYOK-encryptie
```

`ENCRYPTION_KEY`: genereer met  
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Commando’s

```bash
npm run dev      # Dev server op http://localhost:3000
npm run build    # Productiebuild
npm run lint     # ESLint
```

### Database

- Migraties: `npx drizzle-kit push` (Supabase pooler). Bij problemen met de pooler kun je migraties via de Supabase MCP-tool toepassen.
- Seeds (na `source .env.local` of gelijkwaardig):
  - `npx tsx scripts/seed-parties.ts` — basis partijrijen
  - `npx tsx scripts/seed-party-programmes.ts` — partijprogramma’s uit `data/partijstandpunten.md`

---

## Architectuur (kort)

### AI

- **`lib/ai.ts`** — Model-factory (Anthropic, OpenAI, Google). Standaardmodel: `claude-sonnet-4-5`. Bij eigen API-key (BYOK) wordt die key gebruikt en is er geen daglimiet.
- **Gratis tier** — 10 berichten per dag (geteld in `usage_log`). Whitelist-domeinen (o.a. `tweedekamer.nl`, `deltainstituut.nl`) hebben onbeperkt gratis gebruik.

### Tools (LLM)

De AI kan tijdens chat en briefing o.a.:

- **searchParlement** — Volledige-tekstzoeken in parlementaire documenten (Overheid.nl SRU).
- **search-kamerstukken / documenten / handelingen / toezeggingen / stemmingen / agenda** — TK OData API.
- **search-news** — Nieuws (Serper).
- **search-party-docs** — Partijprogramma’s en organisatiedocumenten (DB).
- **fetch-webpage** — Tekst van een URL ophalen.

### Endpoints

- **`/api/chat`** — Streaming chat (AI SDK `streamText` → `toUIMessageStreamResponse`), max 10 tool-stappen.
- **`/api/briefing`** — NDJSON-stream voor briefinggeneratie, max 25 tool-stappen, eindresultaat in `briefings`-tabel.

### Vergadertypes (Meeting skills)

Per vergadertype (plenair debat, commissiedebat, wetgevingsoverleg, etc.) bestaan standaard-instructies; gebruikers kunnen die per type overschrijven op de pagina **Instructies** (`/instructies`). Zie `lib/meeting-skills.ts`.

### Belangrijke mappen

- `app/` — Pagina’s en API-routes
- `components/` — o.a. chat, briefing-dialog, party-selector, progress-sidebar
- `lib/` — ai, tools, db, auth, rate-limit, crypto, user-keys, system-prompt, meeting-skills, tk-api

---

## Deployment

- **Vercel** — Git-integratie met `main`; push naar `main` triggert productie-deploy.
- Omgevingsvariabelen in Vercel gelijk zetten aan lokaal (o.a. `DATABASE_URL`, `AUTH_*`, `ANTHROPIC_API_KEY`, `ENCRYPTION_KEY`, `SERPER_API_KEY`).

---

## Licentie en bijdragen

Repository: [onno-delta/kamertool](https://github.com/onno-delta/kamertool). Voor vragen of bijdragen, open een issue of pull request.
