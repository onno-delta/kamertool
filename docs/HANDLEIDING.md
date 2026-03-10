---
date: 2026-03-10
tags:
  - kamertool
  - handleiding
---

# Handleiding Kamertool

**AI-debatvoorbereiding voor de Tweede Kamer**
kamer.deltainstituut.nl · Versie maart 2026

---

## Wat is Kamertool?

Kamertool is een AI-assistent die Kamerleden helpt bij debatvoorbereiding. Je stelt een vraag of kiest een agendapunt, en de AI doorzoekt automatisch parlementaire databases, nieuwsbronnen en partijprogramma's. Het resultaat: een complete briefing op maat van jouw partij en portefeuille.

**Bronnen die Kamertool doorzoekt:**

| Categorie | Voorbeelden |
|-----------|-------------|
| Parlementaire documenten | Kamerstukken, moties, amendementen, Kamerbrieven, nota's |
| Debatverslagen | Handelingen, plenaire en commissiedebatten |
| Stemmingen | Uitslagen per fractie |
| Toezeggingen | Openstaande toezeggingen van ministers |
| Kamervragen | Recente schriftelijke vragen |
| Agenda | Komende debatten en commissievergaderingen |
| Nieuws | Actuele berichtgeving via Google |
| Partijprogramma's | Standpunten per dossier, ideologische profielen |
| Eigen documenten | Geüploade PDF, DOCX, XLSX of TXT via Dashboard |

---

## Inloggen

1. Ga naar **kamer.deltainstituut.nl** en klik op **Login**
2. Vul je e-mailadres in - je ontvangt een magic link per e-mail
3. Klik op de link om in te loggen (geen wachtwoord nodig)

**Toegang:** Gebruikers met een `@tweedekamer.nl`-adres worden automatisch gekoppeld aan hun Kamerlidprofiel en hebben onbeperkte toegang. Overige gebruikers: 10 berichten per dag gratis, of onbeperkt met een eigen API-sleutel (zie Instellingen). De chat is ook zonder account te gebruiken.

---

## De pagina's

### Chat (startpagina `/`)

De hoofdinterface. Stel een vraag over een debat of onderwerp en de AI zoekt direct relevante bronnen op. Een volledig antwoord bevat: samenvatting, relevante Kamerstukken, moties, openstaande toezeggingen, fractiestandpunten, recent nieuws en suggestievragen voor het debat.

- **Partij selecteren** (linksboven) - de AI formuleert vanuit jouw partijperspectief en raadpleegt het verkiezingsprogramma
- **Kamerlid selecteren** - de AI zoekt eerdere interventies van dat Kamerlid en personaliseert suggesties
- **Model wisselen** - kies tussen verschillende AI-modellen (Anthropic, OpenAI, Google)
- **URL delen** - plak een link in de chat en de AI haalt de inhoud op als startpunt
- **Suggestiecarrousel** - snelstartvragen onder het invoerveld

### Agenda (`/agenda`)

Kameragenda voor de komende 14 dagen. Filter op commissie of selecteer een Kamerlid om alleen relevante vergaderingen te zien. Klik op **Voorbereiden** bij een agendapunt om direct een briefing te starten.

### Voorbereiden (`/voorbereiden`)

Genereer een uitgebreide debatbriefing. De generator werkt in drie fasen:

1. **Bronnen zoeken** - doorzoekt alle beschikbare databases
2. **Documenten lezen** - haalt volledige teksten op van relevante documenten
3. **Briefing schrijven** - stelt het document samen met bronverwijzingen

Selecteer het vergadertype (plenair debat, commissiedebat, wetgevingsoverleg, etc.) voor een briefing op maat. De inhoud past zich aan: bij een plenair debat krijg je interruptiestrategieen, bij een wetgevingsoverleg meer technische analyse.

### Briefings (`/briefings`)

Overzicht van al je opgeslagen briefings. Zoek op onderwerp. Open een briefing om de inhoud te bekijken, als PDF te downloaden of als Markdown te kopieren.

### Smoelenboek (`/smoelenboek`)

Ledenlijst van alle Kamerleden en kabinetsleden. Zoek op naam, filter op partij of rol. De detailpagina per persoon toont: foto, biografie, commissielidmaatschappen, contactgegevens, medewerkers en activiteitenfeeds (documenten, stemmingen, toezeggingen, debatbijdragen, agenda).

Je kunt zelf contactgegevens en medewerkers toevoegen per Kamerlid.

### Instellingen (`/settings`)

- **Kamerleden** - selecteer welke Kamerleden je volgt (bepaalt automatisch je partij en relevante dossiers)
- **Bronnen** - beheer 60+ ingebouwde bronnen en voeg eigen bronnen toe. Schakel "Zoek ook buiten deze bronnen" aan of uit
- **API-sleutel** - voeg je eigen sleutel toe (Anthropic, OpenAI of Google) voor onbeperkt gebruik. Je sleutel wordt versleuteld opgeslagen
- **Gebruik** - bekijk hoeveel van je daglimiet je hebt verbruikt

### Instructies (`/instructies`)

Pas de briefing-instructies aan per vergadertype. Elk van de 13 vergadertypen heeft een standaard prompttemplate. Overschrijf dit met eigen instructies om altijd bepaalde secties te krijgen, een vaste speechlengte af te dwingen, of een specifieke toon te kiezen.

### Dashboard (`/dashboard`)

Organisatiebeheer: voeg collega's toe en upload gedeelde documenten (PDF, DOCX, XLSX, TXT). Geüploade documenten worden doorzoekbaar voor alle teamleden in chat en briefings.

---

## Veelgestelde vragen

**"Dagelijkse limiet bereikt"** - Voeg in Instellingen een eigen API-sleutel toe voor onbeperkt gebruik, of wacht tot de volgende dag.

**De briefing is te lang of te kort** - Pas in Instructies de instructie voor het vergadertype aan (bijv. "Concept-speech maximaal 4 minuten").

**Hoe actueel is de informatie?** - Kamertool zoekt live in parlementaire databases en nieuwsbronnen. De informatie is zo actueel als de bronnen zelf.

**Kan ik de AI vertrouwen?** - De AI geeft altijd bronverwijzingen (Kamerstuknummers, data, namen). Controleer belangrijke claims. De tool is een startpunt voor voorbereiding, geen vervanging van eigen onderzoek.

**Welk AI-model wordt gebruikt?** - Standaard Claude Sonnet 4.5 (Anthropic). Wissel via de modelkiezer in de chat naar andere modellen.

---

*Kamertool is een product van Delta Instituut voor Staatscapaciteit. Vragen of feedback? Neem contact op via het Delta-team.*
