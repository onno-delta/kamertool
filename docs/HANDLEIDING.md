# Handleiding Kamertool

Kamertool helpt je bij de voorbereiding van debatten in de Tweede Kamer. Met de chat kun je vragen stellen over Kamerstukken, debatten en stemmingen; met de briefinggeneratie maak je in één keer een voorbereidingsdocument voor een specifiek debat. Deze handleiding legt uit hoe je de app gebruikt.

---

## Inloggen

1. Ga naar **Login** en vul je e-mailadres in.
2. Je ontvangt een magic link per e-mail. Klik op de link om in te loggen.
3. Na het inloggen kun je de chat direct gebruiken. Voor **Instellingen**, **Briefings**, **Instructies** en **Dashboard** moet je ingelogd zijn.

---

## Chat (hoofdpagina)

De chat is het hart van Kamertool. Je stelt een vraag in gewone taal en de AI zoekt in parlementaire bronnen (Kamerstukken, handelingen, stemmingen, toezeggingen, agenda) en nieuws, en geeft een antwoord met bronverwijzingen.

### Wat je kunt vragen

- *"Wat zijn de standpunten van de fracties over [onderwerp]?"*
- *"Welke toezeggingen zijn er nog open over [beleidsterrein]?"*
- *"Geef een overzicht van recente Kamervragen over [onderwerp]."*
- *"Wat staat er op de agenda voor komende week?"*
- *"Zoek Kamerstukken over [onderwerp]."*

### Partij en model

- **Partij** — Kies eventueel een fractie. De AI houdt dan rekening met het partijstandpunt en kan antwoorden meer in lijn met die fractie formuleren.
- **Model** — Zonder eigen API-key kun je het standaardmodel wisselen (bijv. Haiku, Sonnet, Opus). Met een eigen key (zie Instellingen) wordt je opgeslagen model gebruikt.

### Daglimiet (gratis gebruik)

- Zonder eigen API-key: **10 berichten per dag**.
- Bij een e-mailadres van o.a. `@tweedekamer.nl` of `@deltainstituut.nl` geldt een hogere/onbeperkte limiet (afhankelijk van configuratie).
- Met een **eigen API-key** (Instellingen) is het gebruik onbeperkt.

---

## Agenda

Via **Agenda** zie je de geplande activiteiten van de Kamer (debatten, commissievergaderingen, stemmingen, etc.) voor een gekozen periode.

- Stel **Van** en **Tot** in om de datumbereik te bepalen.
- Per activiteit zie je onder meer: soort (plenair debat, commissiedebat, wetgevingsoverleg, etc.), onderwerp, datum en tijd.
- Klik op **Voorbereiden** bij een activiteit om naar de briefingpagina te gaan met dat onderwerp (en vergadertype) al ingevuld.

---

## Voorbereiden / Briefing genereren

Op de pagina **Voorbereiden** wordt automatisch een debatbriefing gegenereerd voor het gekozen onderwerp. Je komt hier vaak via de Agenda (knop "Voorbereiden"), maar je kunt ook direct naar `/voorbereiden` gaan met parameters `?topic=...` en eventueel `?soort=...`.

### Verloop

1. Je ziet het onderwerp bovenaan.
2. De AI zoekt in parlementaire bronnen en bouwt de briefing op. Tijdens het genereren zie je een voortgangsindicator; op desktop ook een zijbalk met de uitgevoerde stappen (tools).
3. Na afloop:
   - De briefing wordt opgeslagen in **Briefings**.
   - Je kunt **Download PDF** gebruiken om de briefing als PDF te downloaden.
   - **Kopieer tekst** plakt de volledige tekst in je klembord.
   - **Briefing bekijken** klapt de inhoud in de pagina uit of in.

### Inhoud van de briefing

De inhoud hangt af van het **vergadertype** (bijv. plenair debat, commissiedebat, wetgevingsoverleg). Standaard bevat een briefing o.a.:

- Aanleiding en politieke context
- Analyse van standpunten en documenten
- Eventueel interruptiestrategie, conceptmoties of technische analyse (afhankelijk van het type)
- Een concept-speech op maat van het gekozen vergadertype

Je kunt de instructies per vergadertype aanpassen via **Instructies** (zie hieronder).

---

## Briefings (opgeslagen briefings)

Onder **Briefings** vind je al je eerder gegenereerde briefings.

- Gebruik het **zoekveld** om op onderwerp of tekst te zoeken.
- Klik op een briefing om de inhoud te bekijken.
- Vanuit het detail kun je:
  - **PDF downloaden** — briefing als PDF opslaan
  - **PDF openen** — briefing in een nieuw tabblad als PDF bekijken

---

## Instellingen

In **Instellingen** regel je je API-key, gebruik en voorkeuren.

### API-key (BYOK – Bring Your Own Key)

- Zonder eigen key gebruik je de gratis tier (o.a. 10 berichten per dag).
- Met een eigen key:
  - Kies **Provider** (Anthropic, OpenAI of Google) en **Model**.
  - Vul je API-key in en sla op. Er kan maar één actieve key per gebruiker zijn.
  - Je key wordt versleuteld opgeslagen. Gebruik is daarna onbeperkt voor chat en briefings.
- **Test key** controleert of de key geldig is met een korte proefaanroep.

### Gebruik (gratis tier)

- Hier zie je hoeveel van de dagelijkse limiet je hebt verbruikt (bijv. 3/10 berichten). Met een actieve eigen key wordt de limiet niet toegepast.

### Voorkeuren

- **Standaardpartij** — Partij die in de chat als standaard wordt geselecteerd.
- **Dossiers** — Beleidsdossiers waarop je je wilt richten (o.a. voor briefings).
- **Kamerleden** — Specifieke Kamerleden; de AI kan hun standpunten en bijdragen meenemen in antwoorden en briefings.

Deze voorkeuren worden in de chat en bij het genereren van briefings gebruikt.

---

## Instructies (per vergadertype)

Op de pagina **Instructies** kun je per **vergadertype** bepalen hoe de AI briefings opstelt. Elk type (plenair debat, commissiedebat, wetgevingsoverleg, notaoverleg, etc.) heeft standaardtekst; die kun je overschrijven met je eigen instructies.

- **Standaard** — De ingebouwde instructie voor dat type.
- **Aangepast** — Je eigen tekst. Alleen aangepaste velden worden opgeslagen.
- **Opslaan** — Sla je wijzigingen op. Bij het genereren van een briefing geldt: jouw instructie voor dat vergadertype > standaard > geen extra instructie.

Handig als je bijvoorbeeld altijd bepaalde secties wilt (of juist niet), of een vaste speechlengte of toon wilt afdwingen.

---

## Dashboard (organisaties)

Als je bij een **organisatie** hoort, kun je onder **Dashboard**:

- Leden van de organisatie beheren
- Organisatiedocumenten toevoegen

Deze documenten kunnen door de AI worden doorzocht (o.a. bij chat en briefing) als je bij die organisatie bent ingelogd.

---

## Overzicht pagina’s

| Pagina        | Pad           | Toelichting                                      |
|---------------|---------------|--------------------------------------------------|
| Chat          | `/`           | Hoofdchat voor vragen over Kamer en beleid       |
| Agenda        | `/agenda`     | Kameragenda; link naar voorbereiden              |
| Voorbereiden  | `/voorbereiden?topic=...&soort=...` | Briefing genereren voor één onderwerp |
| Briefings     | `/briefings`  | Lijst en zoeken in opgeslagen briefings          |
| Instellingen  | `/settings`  | API-key, gebruik, partij/dossiers/Kamerleden     |
| Instructies   | `/instructies` | Instructies per vergadertype aanpassen          |
| Dashboard     | `/dashboard`  | Organisatie: leden en documenten                 |
| Login         | `/login`      | Inloggen via magic link                          |

---

## Veelgestelde vragen

**Ik zie "Dagelijkse limiet bereikt".**  
Voeg in Instellingen een eigen API-key toe (BYOK) voor onbeperkt gebruik, of wacht tot de volgende dag (limiet wordt per dag gereset).

**De briefing is te lang / te kort.**  
Pas in **Instructies** de instructie voor het betreffende vergadertype aan (bijv. "Concept-speech maximaal 4 minuten" of "Uitgebreide technische analyse").

**Hoe komt de AI aan Kamerinformatie?**  
Kamertool gebruikt o.a. OpenTK (volledige-tekstzoeken in parlementaire documenten) en de officiële TK OData-API (Kamerstukken, handelingen, stemmingen, toezeggingen, agenda). Nieuws komt via een zoek-API; partijstandpunten uit de in de app gevoede partijprogramma’s.

**Kan ik de chat zonder account gebruiken?**  
Ja, de chat is ook zonder inloggen te gebruiken, binnen de daglimiet. Voor opgeslagen briefings, instellingen, instructies en dashboard is inloggen nodig.

---

*Laatste aanpassing: maart 2025. Vragen of fouten? Neem contact op met de beheerder of open een issue in de repository.*
