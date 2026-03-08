/**
 * Default "skills" (prompt instructions) per vergadertype.
 * Users can override these in Settings.
 */

export type MeetingSkill = {
  soort: string
  label: string
  prompt: string
}

export const MEETING_SKILLS: MeetingSkill[] = [
  {
    soort: "Plenair debat",
    label: "Plenair debat",
    prompt: `Plenair debat - het meest zichtbare format in de Tweede Kamer. Media kijken mee, interrupties zijn scherp, moties worden ingediend. Alles wat hier gezegd wordt is direct publiek.

Wat het Kamerlid nodig heeft:
- Interruptiestrategie per relevante tegenstander
- 2-3 conceptmoties met coalitie-rekensom
- Kennis van de media-invalshoek

Onderzoeksstrategie:
1. Zoek de directe aanleiding via searchParlement (bijv. "Kamerbrief [onderwerp]" of "nota [onderwerp]")
2. Haal de volledige tekst op via getDocumentText
3. Zoek in searchHandelingen naar eerdere uitspraken van de minister over dit onderwerp
4. Zoek via searchStemmingen naar stempatronen van fracties op dit dossier
5. Zoek via searchNews de actuele media-invalshoek
6. Zoek via searchPartyDocs het partijstandpunt op

Schrijf de briefing in deze structuur:

## Samenvatting
2-3 alinea's: aanleiding, stand van zaken, politieke context.

## Kernanalyse
Inhoudelijke analyse van de relevante Kamerstukken. Per document: nummer, datum, wat erin staat, en waarom het relevant is.

## Interruptiestrategie
Per relevante fractie/minister: hun verwachte positie, het zwakke punt, en een concrete interruptie met bronverwijzing.

## Conceptmoties
Per motie:
- **Dictum:** "verzoekt de regering..." of "spreekt uit dat..."
- **Toelichting:** 2 zinnen waarom deze motie nodig is
- **Verwachte steun:** welke fracties waarschijnlijk voor/tegen stemmen

## Standpunten per Fractie
Overzicht op basis van stemmingen en eerdere uitspraken in Handelingen.`,
  },
  {
    soort: "Commissiedebat",
    label: "Commissiedebat",
    prompt: `Commissiedebat - hier gebeurt het echte beleidswerk. Minder media-aandacht, maar meer ruimte voor inhoud. Het Kamerlid moet elk agendapunt beheersen, elke Kamerbrief kennen, en de minister scherp bevragen.

Wat het Kamerlid nodig heeft:
- Per-agendapunt analyse met documentverwijzingen
- Overzicht van openstaande toezeggingen
- Vergelijking beleid vs. verkiezingsprogramma

Onderzoeksstrategie:
1. Zoek via searchParlement naar alle agendastukken (bijv. "Kamerbrief [beleidsterrein]", "voortgangsrapportage [onderwerp]")
2. Haal per gevonden document de volledige tekst op via getDocumentText
3. Zoek via searchToezeggingen naar openstaande toezeggingen op dit beleidsterrein
4. Zoek via getRecenteKamervragen naar recent gestelde schriftelijke vragen
5. Zoek via searchPartyDocs het partijstandpunt en vergelijk met het kabinetsbeleid
6. Zoek via searchStemmingen naar eerdere stemmingen op dit dossier

Schrijf de briefing in deze structuur:

## Samenvatting
Beknopt overzicht: welke stukken liggen voor, wat is de rode draad, waar zit de politieke spanning.

## Analyse per agendapunt
Per agendapunt:
- **Document:** nummer, titel, datum
- **Inhoud:** samenvatting van de hoofdpunten
- **Kritische kanttekeningen:** wat ontbreekt, wat is zwak, wat is onduidelijk
- **Vragen voor de minister:** 2-3 concrete vragen met verwijzing naar het document

## Openstaande toezeggingen
Toezeggingen die de minister eerder deed maar nog niet is nagekomen. Per toezegging: datum, inhoud, status.

## Standpunten per Fractie
Posities van relevante fracties op basis van stemmingen en eerdere bijdragen.`,
  },
  {
    soort: "Wetgevingsoverleg",
    label: "Wetgevingsoverleg",
    prompt: `Wetgevingsoverleg - artikel-voor-artikel bespreking van een wetsvoorstel. Juridische precisie is essentieel. Het Kamerlid moet weten waar de wet zwak is, wat de Raad van State zegt, en welke amendementen kansrijk zijn.

Wat het Kamerlid nodig heeft:
- Analyse per relevant wetsartikel
- Samenvatting advies Raad van State
- 1-3 conceptamendementen op specifieke artikelen
- Overzicht amendementen van andere fracties

Onderzoeksstrategie:
1. Zoek via searchParlement naar het wetsvoorstel (bijv. "wetsvoorstel [titel]" of "Kamerstuk [nummer]")
2. Zoek ook de Memorie van Toelichting en het advies van de Raad van State
3. Haal alle drie volledige teksten op via getDocumentText
4. Zoek via searchKamerstukken naar ingediende amendementen van andere fracties
5. Zoek via searchPartyDocs het partijstandpunt op
6. Zoek via searchDocumenten naar uitvoeringstoetsen of adviezen van betrokken instanties

Schrijf de briefing in deze structuur:

## Samenvatting wetsvoorstel
Wat regelt het, waarom is het nodig, wanneer treedt het in werking.

## Advies Raad van State
Hoofdpunten van het RvS-advies en de reactie van de regering (nader rapport).

## Wetsanalyse per artikel
Per relevant artikel:
- **Artikel [nummer]:** wat het regelt
- **Gevolgen:** impact voor burgers, bedrijven of uitvoeringsorganisaties
- **Bezwaren:** juridische of praktische problemen

## Amendementen andere fracties
Overzicht van ingediende amendementen: indiener, artikel, strekking.

## Conceptamendementen
Per amendement:
- **Op artikel:** [nummer]
- **Wijziging:** concrete tekstaanpassing
- **Toelichting:** waarom deze wijziging nodig is

## Juridische kanttekeningen
Mogelijke conflicten met Grondwet, EU-recht, EVRM of bestaande wetgeving.`,
  },
  {
    soort: "Tweeminutendebat",
    label: "Tweeminutendebat",
    prompt: `Tweeminutendebat - maximaal 2 minuten spreektijd om een punt te maken en een motie in te dienen. Volgt op een eerder commissiedebat. Elke seconde telt.

Wat het Kamerlid nodig heeft:
- Terugblik: wat bleef onopgelost in het commissiedebat
- 1-2 conceptmoties met verwachte steun

Onderzoeksstrategie:
1. Zoek via searchParlement of searchHandelingen naar het voorafgaande commissiedebat over dit onderwerp
2. Zoek via searchToezeggingen welke toezeggingen de minister deed
3. Zoek via searchStemmingen naar steunpatronen voor vergelijkbare moties
4. Zoek via searchPartyDocs het partijstandpunt voor de motie-formulering

Schrijf de briefing in deze structuur:

## Terugblik commissiedebat
Wat was de uitkomst? Welke toezeggingen zijn gedaan? Wat bleef open of onbevredigend?

## Onopgeloste punten
Punten waar het Kamerlid nu actie op kan ondernemen via een motie.

## Conceptmoties
Per motie:
- **Dictum:** "verzoekt de regering..." of "spreekt uit dat..."
- **Toelichting:** 2 zinnen
- **Verwachte steun:** welke fracties waarschijnlijk voor/tegen`,
  },
  {
    soort: "Notaoverleg",
    label: "Notaoverleg",
    prompt: `Notaoverleg - debat over een specifieke beleidsnota of beleidsbrief. Het Kamerlid moet de nota door en door kennen en vanuit het partijperspectief beoordelen: waar sluit het aan, waar wijkt het af, en welke alternatieven zijn er?

Wat het Kamerlid nodig heeft:
- Grondige analyse van de nota per hoofdpunt
- Vergelijking met partijprogramma
- Concrete beleidsalternatieven

Onderzoeksstrategie:
1. Zoek via searchParlement naar de nota/beleidsbrief die centraal staat
2. Haal de volledige tekst op via getDocumentText
3. Zoek via searchPartyDocs het partijstandpunt op dit beleidsterrein
4. Zoek via searchNews naar reacties van belangenorganisaties en uitvoerders
5. Zoek via searchDocumenten naar uitvoerbaarheidsanalyses of adviezen

Schrijf de briefing in deze structuur:

## Samenvatting nota
Wat is het doel van de nota, welke maatregelen worden voorgesteld, wat is de financiele onderbouwing.

## Nota-analyse per hoofdpunt
Per hoofdpunt:
- **Maatregel:** wat wordt voorgesteld
- **Beoordeling:** sluit dit aan bij het partijstandpunt? Wat is goed, wat ontbreekt?
- **Impact:** verwachte effecten op burgers, bedrijven, uitvoering

## Beleidsalternatieven
Alternatieve maatregelen die beter passen bij de partijvisie. Per alternatief: wat, waarom, en hoe te realiseren.`,
  },
  {
    soort: "Begrotingsoverleg",
    label: "Begrotingsoverleg",
    prompt: `Begrotingsoverleg - debat over de begroting van een specifiek ministerie. Het draait om euro's: waar gaat het geld heen, wat is er veranderd, en waar kan de fractie verschuivingen voorstellen?

Wat het Kamerlid nodig heeft:
- Analyse van de belangrijkste begrotingsposten en verschuivingen
- Bevindingen van Rekenkamer en CPB
- 1-2 begrotingsamendementen met dekking

Onderzoeksstrategie:
1. Zoek via searchParlement naar de begrotingsstukken (bijv. "begroting [ministerie] [jaar]")
2. Haal relevante stukken op via getDocumentText
3. Zoek via searchDocumenten naar rapporten van de Algemene Rekenkamer en CPB-doorrekeningen
4. Zoek via searchPartyDocs de financiele prioriteiten van de partij
5. Zoek via searchKamerstukken naar amendementen van andere fracties op deze begroting

Schrijf de briefing in deze structuur:

## Samenvatting
Totaalbeeld van de begroting: omvang, prioriteiten, grootste verschuivingen t.o.v. vorig jaar.

## Begrotingsanalyse
Top begrotingsposten:
- **Post:** naam en bedrag
- **Verschuiving:** verandering t.o.v. vorig jaar (bedrag en percentage)
- **Beoordeling:** opvallend, problematisch of kansrijk voor amendering

## Rekenkamer en CPB
Relevante bevindingen over dit beleidsterrein: doelmatigheid, effectiviteit, risico's.

## Begrotingsamendementen
Per amendement:
- **Post:** welke begrotingspost wijzigen
- **Wijziging:** bedrag erbij of eraf
- **Dekking:** waarmee wordt het gefinancierd (verschuiving binnen de begroting)
- **Toelichting:** waarom`,
  },
  {
    soort: "Rondetafelgesprek",
    label: "Rondetafelgesprek",
    prompt: `Rondetafelgesprek - de commissie spreekt met experts en belanghebbenden. Er is geen minister aanwezig, dit is geen debat maar intelligence-gathering. Het doel: informatie ophalen die de fractie kan gebruiken in toekomstige debatten.

Wat het Kamerlid nodig heeft:
- Profiel per genodigde expert/organisatie
- Gerichte vragen per genodigde
- Overzicht van de informatiebehoefte voor toekomstige debatten

Onderzoeksstrategie:
1. Zoek via searchParlement naar de agenda en uitnodigingen voor dit rondetafelgesprek
2. Zoek per genodigde organisatie via searchNews en fetchWebPage naar hun standpunten en recente publicaties
3. Zoek via searchParlement en searchDocumenten naar rapporten en adviezen van deze organisaties
4. Zoek via searchPartyDocs welke informatie de fractie nodig heeft op dit dossier

Schrijf de briefing in deze structuur:

## Samenvatting
Onderwerp van het rondetafelgesprek, waarom het is georganiseerd, welke beleidsvragen centraal staan.

## Genodigden
Per expert/organisatie:
- **Naam en functie**
- **Achtergrond:** wat doen ze, wat is hun expertise
- **Bekende standpunten:** op basis van publicaties en eerdere uitspraken
- **Vragen:** 2-3 gerichte vragen die relevante informatie opleveren voor de fractie

## Informatiebehoefte
Welke informatie moet uit dit gesprek komen om het partijstandpunt te onderbouwen in toekomstige debatten? Welke feiten of ervaringen zijn nog onbekend?

Lever een geprioriteerde vragenlijst over alle genodigden heen.`,
  },
  {
    soort: "Procedurevergadering",
    label: "Procedurevergadering",
    prompt: `Procedurevergadering - hier wordt bepaald wat de commissie gaat doen: welke debatten worden ingepland, welke Kamerbrieven worden geagendeerd, wie wordt rapporteur. Strategisch belangrijk: de fractie kan invloed uitoefenen op wat er wel en niet besproken wordt.

Wat het Kamerlid nodig heeft:
- Per agendapunt: aanbeveling (agenderen/niet agenderen/rapporteur)
- Suggesties voor eigen agendapunten
- Overzicht van strategische keuzes

Onderzoeksstrategie:
1. Zoek via searchParlement of searchAgenda naar de conceptagenda/besluitenlijst van deze procedurevergadering
2. Zoek achtergrond bij de voorgestelde agendapunten via searchDocumenten
3. Zoek via searchPartyDocs welke onderwerpen prioriteit hebben voor de fractie
4. Zoek via searchNews naar actuele ontwikkelingen die agendering verdienen

Schrijf de briefing in deze structuur:

## Samenvatting
Overzicht van de procedurevergadering: hoeveel punten, welke thema's, waar zitten de strategische keuzes.

## Agendaoverzicht
Per agendapunt:
- **Punt:** wat wordt voorgesteld (debat aanvragen, brief agenderen, rapporteur benoemen, etc.)
- **Achtergrond:** korte context
- **Aanbeveling:** agenderen / niet agenderen / steunen / rapporteur aanbieden - met onderbouwing

## Suggesties eigen agendering
Onderwerpen die de fractie zelf kan voorstellen voor een debat of overleg, met onderbouwing waarom dit nu relevant is.

Lever een beknopt strategisch overzicht per agendapunt.`,
  },
  {
    soort: "Technische briefing",
    label: "Technische briefing",
    prompt: `Technische briefing - ambtenaren of externe deskundigen informeren de commissie over een technisch of complex onderwerp. Geen politiek debat, maar een kans om de materie te doorgronden en slimme vragen te stellen die later politiek bruikbaar zijn.

Wat het Kamerlid nodig heeft:
- Achtergrond over het technische onderwerp
- 10-15 inhoudelijke vragen, geordend per thema
- Aandachtspunten: waar raakt dit onderwerp aan partijstandpunten of lopende debatten

Onderzoeksstrategie:
1. Zoek via searchParlement naar het onderwerp van de briefing en gerelateerde Kamerstukken
2. Zoek via searchDocumenten naar rapporten en adviezen over dit onderwerp
3. Zoek via getRecenteKamervragen naar eerder gestelde vragen
4. Zoek via searchNews naar actuele context
5. Zoek via searchPartyDocs naar relevante partijstandpunten

Schrijf de briefing in deze structuur:

## Achtergrond
Wat is het onderwerp, waarom is het technisch complex, wat is de politieke relevantie, welke organisatie geeft de briefing.

## Kernvragen
10-15 inhoudelijke vragen, geordend per thema. Focus op het doorgronden van de materie, niet op politieke punten. Voorbeelden: "Hoe verhoudt X zich tot Y?", "Wat zijn de risico's van Z?", "Welke alternatieven zijn overwogen?"

## Aandachtspunten voor de fractie
Welke aspecten van dit onderwerp raken aan de partijstandpunten of lopende debatten? Waar moet het Kamerlid extra op letten?

Lever een gestructureerde vragenlijst op.`,
  },
  {
    soort: "Gesprek",
    label: "Gesprek",
    prompt: `Gesprek - een informeel overleg van de commissie met externe partijen of belanghebbenden. Minder formeel dan een rondetafelgesprek, maar goede voorbereiding is essentieel: weet met wie je praat, wat zij willen, en wat jij van hen nodig hebt.

Wat het Kamerlid nodig heeft:
- Profiel per gesprekspartner
- Gespreksagenda met verwachte thema's
- 5-10 strategische vragen

Onderzoeksstrategie:
1. Zoek via searchParlement en searchNews naar de gesprekspartner(s) en hun organisatie
2. Zoek via fetchWebPage hun website en recente publicaties op
3. Zoek via searchPartyDocs relevante partijstandpunten
4. Zoek via searchDocumenten naar relevante beleidsontwikkelingen

Schrijf de briefing in deze structuur:

## Samenvatting
Waar gaat het gesprek over, met wie, en waarom nu.

## Gesprekspartners
Per genodigde:
- **Naam en functie**
- **Achtergrond:** organisatie, expertise, belangen
- **Bekende standpunten:** eerdere publicaties of uitspraken
- **Wat willen zij?** wat is hun belang in dit gesprek

## Gespreksagenda
Verwachte thema's en hoe ze raken aan het partijstandpunt.

## Strategische vragen
5-10 vragen, geordend op prioriteit. Focus op het verkrijgen van informatie die politiek bruikbaar is.

Lever een beknopte gespreksvoorbereiding.`,
  },
  {
    soort: "Stemmingen",
    label: "Stemmingen",
    prompt: `Stemmingen - de Kamer stemt over moties, amendementen en wetsvoorstellen. Het Kamerlid heeft een helder stemadvies nodig per item, met onderbouwing vanuit het partijstandpunt, en een waarschuwing bij politiek gevoelige stemmingen.

Wat het Kamerlid nodig heeft:
- Per item: stemadvies (voor/tegen/onthouden) met onderbouwing
- Overzicht van gevoelige stemmingen
- Snelle scan: wat is mediageniek, wat kan gedoe opleveren

Onderzoeksstrategie:
1. Zoek via searchStemmingen en searchKamerstukken naar de moties, amendementen en wetsvoorstellen die in stemming komen
2. Haal de tekst op van relevante moties/amendementen via getDocumentText
3. Zoek via searchPartyDocs het partijstandpunt per thema
4. Zoek via searchHandelingen de context van het debat waarin de moties zijn ingediend
5. Zoek via searchNews of er media-aandacht is voor specifieke stemmingen

Schrijf de briefing in deze structuur:

## Samenvatting
Hoeveel stemmingen, over welke thema's, wat zijn de belangrijkste.

## Stemoverzicht
Per motie/amendement/wetsvoorstel:
- **Nummer en indiener**
- **Strekking:** 1-2 zinnen wat het inhoudt
- **Stemadvies:** voor / tegen / onthouden
- **Onderbouwing:** waarom, vanuit het partijstandpunt

## Gevoelige stemmingen
Stemmingen waarbij het stemgedrag politiek risico draagt, mediageniek is, of afwijkt van verwachte bondgenoten. Per gevoelige stemming: wat is het risico en hoe te handelen.

Lever een helder stemadviesoverzicht.`,
  },
  {
    soort: "Regeling van werkzaamheden",
    label: "Regeling van werkzaamheden",
    prompt: `Regeling van werkzaamheden - het korte plenaire overleg waarin debatten worden aangevraagd, de agenda wordt vastgesteld en procedurele verzoeken worden gedaan. Strategisch moment: welke debatten vraag je aan, welke steun je?

Wat het Kamerlid nodig heeft:
- Overzicht lopende debataanvragen
- Mogelijke eigen debataanvragen met onderbouwing
- Inschatting van steun bij andere fracties

Onderzoeksstrategie:
1. Zoek via searchAgenda en searchParlement naar recente debataanvragen en de plenaire planning
2. Zoek via searchNews naar urgente onderwerpen die een debat rechtvaardigen
3. Zoek via searchPartyDocs welke thema's prioriteit hebben voor de fractie
4. Zoek via searchKamerstukken naar recente Kamerbrieven die aanleiding kunnen zijn voor een debat

Schrijf de briefing in deze structuur:

## Samenvatting
Wat staat er op de agenda van de regeling, welke aanvragen zijn er al, welke kansen liggen er.

## Lopende debataanvragen
Per aanvraag: aanvrager, onderwerp, status (wel/niet gesteund, wel/niet ingepland).

## Mogelijke eigen debataanvragen
Per suggestie:
- **Onderwerp:** waarover
- **Aanleiding:** Kamerbrief, nieuwsgebeurtenis of beleidsontwikkeling
- **Onderbouwing:** waarom dit nu een debat verdient
- **Verwachte steun:** welke fracties dit waarschijnlijk steunen

Lever een compact strategisch overzicht.`,
  },
  {
    soort: "Werkbezoek",
    label: "Werkbezoek",
    prompt: `Werkbezoek - Kamerleden bezoeken een organisatie, instelling of locatie om zich ter plekke te laten informeren. Het gaat om ervaringen uit de praktijk ophalen die bruikbaar zijn in Kamerdebatten.

Wat het Kamerlid nodig heeft:
- Achtergrond van de te bezoeken organisatie
- Relevante beleidsontwikkelingen die deze organisatie raken
- 10-15 vragen voor gesprekken ter plaatse
- Mediakansen

Onderzoeksstrategie:
1. Zoek via fetchWebPage de website van de organisatie op voor achtergrondinformatie
2. Zoek via searchParlement naar Kamervragen, debatten en rapporten gerelateerd aan deze organisatie of sector
3. Zoek via searchDocumenten naar relevante beleidswijzigingen, bezuinigingen of investeringen
4. Zoek via searchNews naar recent nieuws over de organisatie
5. Zoek via searchPartyDocs het partijstandpunt op dit beleidsterrein

Schrijf de briefing in deze structuur:

## Samenvatting
Wat wordt bezocht, waarom, en wat is de politieke relevantie.

## Organisatie-achtergrond
Wat doet de organisatie, hoeveel mensen werken er, hoe wordt het gefinancierd, wat is de relatie tot rijksbeleid.

## Relevante beleidsontwikkelingen
Recente wetswijzigingen, bezuinigingen, investeringen of beleidswijzigingen die deze organisatie raken.

## Vragenlijst voor het bezoek
10-15 vragen voor gesprekken ter plaatse, gericht op het ophalen van ervaringen uit de praktijk die bruikbaar zijn in Kamerdebatten.

## Mediakansen
Mogelijke fotomomenten, quotes of bevindingen die de fractie kan gebruiken in communicatie en sociale media.

Lever een compacte voorbereidingsnotitie met achtergrond en vragen.`,
  },
]

/** Get the default skill prompt for a given meeting type */
export function getDefaultSkill(soort: string): string {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  return skill?.prompt ?? ""
}

/** Get all meeting type keys that have a skill */
export function getMeetingTypes(): string[] {
  return MEETING_SKILLS.map((s) => s.soort)
}
