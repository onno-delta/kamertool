---
date: 2026-03-06
tags:
  - kamertool
  - documentatie
---

# Bronnen en integraties

Overzicht van alle databronnen waar Kamertool toegang toe heeft via AI tools, API-endpoints en de interne database.

---

## Externe API's

### 1. Overheid.nl SRU API (zoek.officielebekendmakingen.nl)

Primaire zoekmachine. Full-text zoek over alle parlementaire documenten via het SRU-protocol.

| Tool | Functie |
|------|---------|
| `searchParlement` | Full-text zoek over Kamerstukken, Handelingen en Kamervragen. Filtert op documentsoort en periode. |
| `getDocumentText` | Volledige documenttekst ophalen op documentnummer (bijv. `kst-36748-30`) via XML |
| `getRecenteKamervragen` | Lijst van recent ingediende schriftelijke Kamervragen |

**Geen API-key nodig.** Timeout: 15s. Vervangt OpenTK (berthub.eu/tkconv) dat offline is.

### 2. TK OData API (tweedekamer.nl)

Gestructureerde parlementaire data via de officiele Tweede Kamer API.

**Base URL:** `https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0`
**Cache:** 5 minuten (`next.revalidate: 300`)
**Geen API-key nodig.**

| Tool | Entity | Functie |
|------|--------|---------|
| `searchKamerstukken` | `Zaak` | Moties, amendementen, wetsvoorstellen, brieven, schriftelijke vragen |
| `searchDocumenten` | `Document` | Kamerbrieven, nota's, verslagen, amendementen, memories van toelichting |
| `searchHandelingen` | `Agendapunt` + `Activiteit` | Debatverslagen en vergaderingen |
| `searchStemmingen` | `Besluit` + `Stemming` | Stemmingsuitslagen per fractie (voor/tegen/zetels) |
| `searchToezeggingen` | `Toezegging` | Ministeriele toezeggingen, openstaand of afgedaan |
| `searchAgenda` | `Activiteit` | Komende debatten, commissiedebatten, wetgevingsoverleggen |

Daarnaast gebruikt buiten de AI tools:
- `/api/agenda` — proxied `Activiteit` voor de agendapagina
- `/api/kamerleden` — zoekt Kamerleden via `Persoon`/`FractieZetel`

### 3. Google Serper

Nieuwszoeken via de Serper News API.

| Tool | Functie |
|------|---------|
| `searchNews` | Zoekt recent nieuws, gefilterd op Nederland (`gl: "nl"`, `hl: "nl"`) |

**Vereist:** `SERPER_API_KEY` in environment.

---

## Interne database (Supabase PostgreSQL)

### Partijprogramma's

| Tool | Tabel | Functie |
|------|-------|---------|
| `searchPartyDocs` | `party.programme` | ILIKE-zoek in partijstandpunten |

Bron: `data/partijstandpunten.md` — 13 partijen met ideologisch profiel en standpunten per dossier (19 dossiers), gebaseerd op verkiezingsprogramma's TK2025. Geseed via `scripts/seed-party-programmes.ts`.

### Organisatiedocumenten

| Tool | Tabel | Functie |
|------|-------|---------|
| `searchPartyDocs` | `org_document.content` | ILIKE-zoek in door organisaties geuploade documenten |

Organisaties kunnen eigen documenten uploaden via het Dashboard. Deze worden doorzocht wanneer de gebruiker bij die organisatie hoort.

---

## Web scraping

| Tool | Functie |
|------|---------|
| `fetchWebPage` | Haalt HTML op van elke URL, stript naar platte tekst (max 12.000 tekens) |

Wordt gebruikt wanneer een gebruiker een URL deelt, of wanneer de AI meer context nodig heeft van een specifieke webpagina.

---

## Samenvatting

| # | Bron | Type | Auth |
|---|------|------|------|
| 1 | Overheid.nl SRU (zoek.officielebekendmakingen.nl) | Parlementair full-text | Geen |
| 2 | TK OData API (tweedekamer.nl) | Parlementair gestructureerd | Geen |
| 3 | Google Serper | Nieuws | API key |
| 4 | Supabase PostgreSQL | Partijprogramma's + org docs | Database |
| 5 | Web fetch | Elke URL | Geen |

### Niet geintegreerd (alleen bereikbaar via `searchNews` of `fetchWebPage`)

- wetten.nl
- CBS / CPB / PBL
- Rijksoverheid.nl
- Raad van State adviezen
- Social media (X, LinkedIn)
- Rijksbegroting / financiele data
- EU-bronnen (EUR-Lex, Raad, EP)
