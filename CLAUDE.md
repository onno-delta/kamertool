# CLAUDE.md

Dit bestand geeft instructies aan Claude Code (claude.ai/code) voor het werken aan deze codebase.

## Wat is Kamertool?

Kamertool is een AI-gestuurde voorbereidingstool voor debatten in de Tweede Kamer. Het biedt een chatinterface met AI-modellen die toegang hebben tot parlementaire API's, nieuwsbronnen, partijprogramma's en organisatiedocumenten. Alle tekst in de interface is Nederlands.

## Commando's

```bash
npm run dev      # Start ontwikkelserver (localhost:3000)
npm run build    # Productie-build
npm run lint     # ESLint controle
```

**Database-migraties:** `drizzle-kit push` werkt niet met Supabase's transaction pooler (poort 6543). De stabiele versie (v0.31.9) crasht op check constraints ([#4496](https://github.com/drizzle-team/drizzle-orm/issues/4496)), de bèta (v1.0.0-beta) hangt door prepared statements die PgBouncer niet ondersteunt. Directe verbinding (poort 5432) is onbereikbaar.

**Workaround:** voer migraties uit via directe SQL:
```bash
set -a && source .env.local && set +a && node -e "
const sql = require('postgres')(process.env.DATABASE_URL, { prepare: false });
sql\`ALTER TABLE ... \`.then(() => { console.log('done'); return sql.end() });
"
```
Controleer of drizzle v1 stabiel is uitgebracht: `npm view drizzle-kit dist-tags --json | grep latest` — wanneer `latest` versie `1.x.x` toont, probeer `drizzle-kit push` opnieuw.

**Scripts** (vereisen `set -a && source .env.local && set +a` vooraf):
- `npx tsx scripts/seed-parties.ts` — Basispartijen invoegen
- `npx tsx scripts/seed-party-programmes.ts` — Partijprogramma's bijwerken vanuit `data/partijstandpunten.md`

**Deployment:** Automatische deploy vanaf `main` via Vercel Git-integratie. Push naar `main` activeert een productie-deploy.

Live op https://kamer.deltainstituut.nl (ook https://kamertool.vercel.app) — GitHub-repo: `onno-delta/kamertool`

## Architectuur

**Technologie:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (Supabase) · NextAuth v5 (magic link via Resend) · Vercel AI SDK v6

### AI-laag (`lib/ai.ts`)

Multi-provider modelfabriek die Anthropic, OpenAI en Google ondersteunt. `getModel({ model?, apiKey? })` maakt een `LanguageModel` aan — als er een `apiKey` wordt meegegeven, wordt een nieuwe provider-instantie aangemaakt (BYOK/eigen sleutel); anders wordt teruggevallen op omgevingsvariabelen. Het standaardmodel is `claude-sonnet-4-5`. Gratis gebruikers kunnen van model wisselen via de chat-werkbalk; de geselecteerde modelsleutel wordt meegestuurd in de request body.

**AI SDK v6 specifiek:** Gebruik `maxOutputTokens` (niet `maxTokens`), importeer `LanguageModel` (niet `LanguageModelV1`).

### BYOK-systeem (Breng je eigen sleutel)

Gebruikers slaan hun eigen API-sleutels versleuteld op met AES-256-GCM (`lib/crypto.ts`). Slechts één sleutel tegelijk actief per gebruiker. Gratis: 10 berichten per dag, bijgehouden in de `usage_log`-tabel (`lib/rate-limit.ts`). BYOK-gebruikers hebben onbeperkt gebruik. Whitelisted domeinen (`tweedekamer.nl`, `deltainstituut.nl`, `herprogrammeerdeoverheid.nl`) krijgen onbeperkt gratis toegang.

Stroom: `lib/user-keys.ts` → `lib/crypto.ts` → `user_api_key`-tabel (versleuteld) → `lib/ai.ts` (ontsleuteld bij verzoek)

### AI-tools (`lib/tools/`)

Twaalf tools die het AI-model kan aanroepen tijdens chat- of briefing-generatie:
- `search-overheid.ts` — **Primaire zoektool**: volledige tekstzoekopdracht over alle parlementaire documenten via Overheid.nl SRU API (`zoek.officielebekendmakingen.nl`). Exporteert `searchParlement` (zoeken), `getDocumentText` (volledige documenttekst ophalen op nummer) en `getRecenteKamervragen` (recente schriftelijke vragen). Gebruikt `lib/sru-api.ts` voor SRU-protocolafhandeling.
- `search-kamerstukken.ts` — Kamerstukken via TK OData API
- `search-documenten.ts` — Brieven, nota's, rapporten via TK OData API
- `search-handelingen.ts` — Debatverslagen via TK OData API
- `search-toezeggingen.ts` — Toezeggingen van ministers via TK OData API
- `search-stemmingen.ts` — Stemmingsuitslagen via TK OData API
- `search-agenda.ts` — Aankomende debatten en commissievergaderingen via TK OData API
- `search-news.ts` — Nieuws via Serper API
- `search-party-docs.ts` — Partijprogramma's + organisatiedocumenten uit de database (ILIKE-zoekopdracht)
- `search-exa.ts` — Web, X/Twitter en LinkedIn zoeken via Exa API (scope: web/twitter/linkedin)
- `fetch-webpage.ts` — Tekst ophalen en extraheren van een willekeurige URL

De TK OData API-basis: `https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0` (wrapper in `lib/tk-api.ts`, 5 minuten cache).

Voor een compleet overzicht van alle databronnen, API's en wat wel/niet geïntegreerd is, zie `docs/bronnen.md`.

### Twee AI-eindpunten met verschillende protocollen

**`/api/chat`** — Gebruikt AI SDK's `streamText` → `toUIMessageStreamResponse()`. Verwerkt door `useChat()` hook in `components/chat.tsx`. Maximaal 10 tool-aanroepstappen.

**`/api/briefing`** — Gebruikt AI SDK's `streamText` maar met een **eigen NDJSON-streamingprotocol**: itereert over `result.fullStream`, stuurt `{type:"tool-start"}`, `{type:"tool-done"}` en `{type:"done", content}` als newline-gescheiden JSON. Slaat het eindresultaat op in de `briefings`-tabel. Maximaal 25 tool-aanroepstappen. Heeft een eigen systeemprompt (anders dan chat). Verwerkt door `components/briefing-context.tsx`.

### Vergadervaardigheden (`lib/meeting-skills.ts`)

Prompttemplates per vergadertype (13 typen: Plenair debat, Commissiedebat, Wetgevingsoverleg, enz.) die in de briefing-systeemprompt worden ingevoegd. Gebruikers kunnen deze per vergadertype aanpassen via `/instructies` (opgeslagen in `user_meeting_skill`-tabel). De briefing-route lost op: gebruikersaanpassing > standaardvaardigheid > leeg.

### Partijgegevens

- `lib/parties.ts` — Vaste lijst van 13 partijen (voor UI-dropdowns, validatie)
- `lib/dossiers.ts` — 19 beleidsdossier-definities + `COMMISSIE_DOSSIER_MAP` (commissie → dossier-mapping)
- `data/partijstandpunten.md` — Gestructureerde partijprofielen met ideologische profielen en standpunten per dossier. Ingevoerd in het `party.programme`-veld via `scripts/seed-party-programmes.ts`.
- `lib/system-prompt.ts` — Bouwt de chat-systeemprompt; voegt partijspecifieke instructies toe als er een partij is geselecteerd

### Authenticatie (`auth.ts`, `middleware.ts`)

NextAuth v5 met Resend (magic link e-mail). Database-sessies. De sessie-callback voegt `user.id`, `user.role`, `user.organisationId` en `user.defaultPartyId` toe. Middleware beschermt `/dashboard`, `/settings`, `/instructies` en hun API-routes.

### Databaseschema (`lib/db/schema.ts`)

Belangrijkste tabellen: `party`, `organisation`, `user`, `briefing`, `chat_session`, `user_api_key`, `usage_log`, `org_document`, `user_dossier`, `user_kamerlid`, `user_meeting_skill`, `smoelenboekProfiles`, `smoelenboekContacts`, `smoelenboekMedewerkers`, plus NextAuth-tabellen (`account`, `session`, `verificationToken`). Alle ID's zijn UUID's. Chatberichten worden opgeslagen als JSON-tekst in `chat_session.messages`.

**Databaseverbinding (`lib/db/index.ts`):** Gebruikt `postgres.js` met `prepare: false` — vereist omdat Supabase's transaction pooler (poort 6543) PgBouncer draait, dat geen prepared statements ondersteunt.

### Smoelenboek (`app/smoelenboek/`, `lib/tk-*.ts`)

Ledenlijst met alle huidige Kamerleden + kabinetsleden. De detailpagina (`/smoelenboek/[id]`) toont foto, biografie, commissies, contactgegevens, medewerkers en activiteitenfeeds (documenten, stemmingen, toezeggingen, debatbijdragen, agenda). Kabinetsleden gebruiken `kabinet-`-voorvoegsel-ID's uit `data/kabinet.ts`.

Backend:
- `lib/tk-members.ts` — `getCurrentMembers()`: gecachte lijst van actieve Kamerleden via TK OData (1 uur TTL)
- `lib/tk-commissions.ts` — `getCommissionMap()`: mapt personId → commissie-afkortingen (1 uur TTL)
- `lib/tk-person.ts` — `getPersonDocuments()`, `getFractieStemmingen()`, `getPersonToezeggingen()`, `getPersonHandelingen()`, `getPersonAgenda()`: activiteitenqueries per persoon
- `lib/tk-scraper.ts` — Scrapt `tweedekamer.nl` voor e-mail/biografie (gecacht in `smoelenboekProfiles`-tabel, 30 dagen TTL)
- `lib/match-kamerlid.ts` — Koppelt automatisch `@tweedekamer.nl` e-mailadres aan Kamerlid bij eerste login

DB-tabellen: `smoelenboekProfiles` (gecachte scrape-data), `smoelenboekContacts` (door gebruiker ingevoerde contactgegevens), `smoelenboekMedewerkers` (medewerkerrecords).

### Gedeelde data-context (`components/data-context.tsx`)

Gedeelde state-provider (`DataProvider` / `useDataContext()`) voor partijen, gebruikersvoorkeuren en sessie-Kamerleden-selectie. Eenmalig geladen in `providers.tsx`, gebruikt door chat-, agenda-, voorbereiden- en instellingenpagina's. Voorkomt waterval-fetches.

### Inline tool-voortgang (`components/inline-tool-step.tsx`, `components/progress-sidebar.tsx`)

Chatberichten tonen inline tool-stappen (Cowork-stijl) met iconen, duurtimers en uitklapbare resultaattellers. De briefing-voortgangszijbalk groepeert tools in hogere-orde fasen vanuit vergadervaardigheden. `ChatProgress`-component toont zoek-/ophaal-/samenvattingsfasen.

### Pagina's

- `/` — Hoofdchat-interface (`components/chat.tsx` met `useChat()`, `KamerlidSelector`, `AgendaSidebar`)
- `/agenda` — Kameragenda-overzicht met commissiefilter, Kamerlid-selector, standaard 14 dagen bereik
- `/voorbereiden` — Briefing-generatiepagina (ontvangt `?topic=`, `?soort=`, `?nummer=` van agenda)
- `/briefings` — Opgeslagen briefinggeschiedenis met zoekfunctie
- `/settings` — Kamerlid-eerst-flow: selecteer Kamerleden → automatische partij + dossiers. Bronnenbeheer (60+ ingebouwd + aangepast). "Zoek ook buiten deze bronnen"-schakelaar
- `/instructies` — Vergadervaardigheden aanpassen (per vergadertype prompts bewerken)
- `/smoelenboek` — Ledenlijst met partij-/rolfilter en zoekfunctie
- `/smoelenboek/[id]` — Persoondetailpagina met activiteitenfeeds, contact, medewerkersbeheer
- `/dashboard` — Organisatiebeheer
- `/login` — Magic link inlogscherm

Alle pagina's hebben `loading.tsx` skeleton-loaders voor directe navigatie.

### API-routes

- `/api/chat` — POST, streaming, BYOK + snelheidsbeperking, staat ongeauthenticeerde toegang toe
- `/api/briefing` — POST, NDJSON-streaming, BYOK + snelheidsbeperking, slaat op in database
- `/api/briefings` — GET, lijst van opgeslagen briefings met optionele `?q=` zoekopdracht
- `/api/briefings/pdf` — POST, genereer PDF vanuit briefing-inhoud
- `/api/agenda` — GET, proxy naar TK OData agenda met datumbereikparameters
- `/api/parties` — GET, lijst van alle partijen uit database
- `/api/kamerleden` — GET, zoek Kamerleden via TK OData API
- `/api/kamerleden/commissies` — GET, commissielidmaatschappen voor opgegeven persoon-ID's (`?ids=&vast=true`)
- `/api/smoelenboek` — GET, ledenlijst (Kamerleden + kabinet)
- `/api/smoelenboek/[id]` — GET, persoondetail met commissies, profiel-scrape
- `/api/smoelenboek/[id]/activiteiten` — GET, activiteitenfeed (`?type=documenten|stemmingen|toezeggingen|agenda|handelingen`)
- `/api/smoelenboek/[id]/contact` — GET/POST/DELETE, door gebruiker ingevoerde contactgegevens
- `/api/smoelenboek/[id]/medewerker` — GET/POST/DELETE, medewerkerrecords
- `/api/settings/keys` — GET/POST voor versleutelde API-sleutels
- `/api/settings/keys/[id]` — DELETE specifieke sleutel
- `/api/settings/keys/test` — POST, valideert een sleutel door een minimale LLM-aanroep
- `/api/settings/usage` — GET, huidig gebruik van snelheidsbeperking
- `/api/settings/preferences` — GET/PUT, gebruikersvoorkeuren (Kamerleden, dossiers, bronnen, vergadervaardigheden, zoekBuitenBronnen)
- `/api/organisations` — POST, organisatie aanmaken
- `/api/organisations/[id]/members` + `/documents` — Organisatiebeheer

### Belangrijkste componenten

- `components/chat.tsx` — Hoofd-chat-UI met `useChat()`, modelselector, Kamerlid-selector, suggestiecarrousel
- `components/briefing-context.tsx` — React-context voor briefingstatus, verwerkt NDJSON-stream
- `components/progress-sidebar.tsx` — Tool-voortgang (briefingfasen + chatfasen)
- `components/inline-tool-step.tsx` — Inline tool-stapweergave in chatberichten (icoon, timer, uitklapbare resultaten)
- `components/agenda-sidebar.tsx` — Gepagineerde agenda-zijbalk met Kamerlid-kiezer en commissiefilter
- `components/kamerlid-selector.tsx` — Dropdown met debounced zoekfunctie, toont naam + partijafkorting
- `components/data-context.tsx` — Gedeelde state-provider voor partijen, voorkeuren, sessie-Kamerleden
- `components/providers.tsx` — SessionProvider + DataProvider + BriefingProvider wrapper
- `components/party-selector.tsx` — Partij-dropdown met partijkleuren

### Overige lib-bestanden

- `lib/dossiers.ts` — 19 beleidsdossier-definities + `COMMISSIE_DOSSIER_MAP` (commissie → dossier-mapping)
- `lib/validation.ts` — Zod-schema's voor chat, briefing, smoelenboek contact/medewerker, organisatie
- `data/kabinet.ts` — Vaste lijst van 28 kabinetsleden (ministers + staatssecretarissen) met foto's

## Omgevingsvariabelen

```
DATABASE_URL          # Supabase PostgreSQL-verbindingsstring (poort 6543 voor pooler)
AUTH_SECRET           # NextAuth-geheim (openssl rand -base64 32)
AUTH_TRUST_HOST=true
AUTH_RESEND_KEY       # Resend API-sleutel voor magic link e-mails
EMAIL_FROM            # Afzender-e-mailadres
ANTHROPIC_API_KEY     # Standaard Anthropic-sleutel (gratis tier terugval)
OPENAI_API_KEY        # Optioneel: OpenAI-terugval
GOOGLE_GENERATIVE_AI_API_KEY  # Optioneel: Google-terugval
SERPER_API_KEY        # Google Serper voor nieuwszoeken
EXA_API_KEY           # Exa API voor web/X/LinkedIn zoeken
ENCRYPTION_KEY        # 64-teken hex voor AES-256-GCM (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

## Patronen om te volgen

- Authenticatiepatroon in API-routes: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })`
- Bij filteren op userId EN een andere voorwaarde in Drizzle: gebruik altijd `and()` — ketting nooit `.where()`-aanroepen op `.$dynamic()` queries (de tweede `.where()` overschrijft de eerste)
- Snelheidsbeperkingscontrole in chat-/briefing-routes: controleer eerst `getActiveKey()`; bij BYOK sla snelheidsbeperking over, controleer daarna `isUnlimitedEmail()`, anders roep `checkAndIncrementUsage()` aan
- Alle gebruikersgerichte tekst in het Nederlands
- Toolbeschrijvingen in het Nederlands (ze worden getoond aan het AI-model in de systeemprompt)
- `searchParlement` is de primaire zoektool — de systeemprompt en briefing-prompt instrueren het AI-model om deze eerst te gebruiken, daarna terugvallen op TK OData tools voor gestructureerde zoekopdrachten
