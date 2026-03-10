/**
 * Default "skills" (prompt instructions) per vergadertype.
 *
 * Each skill has two prompt layers:
 * - basePrompt: hidden technical instructions (tool calls, research strategy)
 * - userPrompt: natural language guidance users can override in /instructies
 *
 * The steps array defines the deliverable section names for progress tracking.
 */

export type MeetingSkill = {
  soort: string
  label: string
  basePrompt: string
  userPrompt: string
  steps: string[]
}

export const MEETING_SKILLS: MeetingSkill[] = [
  {
    soort: "Plenair debat",
    label: "Plenair debat",
    steps: ["Aanleiding & context", "Politieke verhoudingen", "Interruptiestrategie", "Conceptmoties"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek de Kamerbrief/nota die tot dit debat heeft geleid (gebruik beide voor bredere dekking)
- searchNews: zoek actueel nieuws voor de media-invalshoek
- searchStemmingen: zoek stemgedrag van fracties op dit dossier
- searchHandelingen: zoek eerdere debatten over dit onderwerp
- searchToezeggingen: zoek openstaande toezeggingen van de minister
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Plenair debat - het meest zichtbare format in de Kamer. Media kijken mee, interrupties zijn scherp, moties worden ingediend.

## Briefing
Schrijf de briefing met deze secties:

## Aanleiding & context
Beschrijf wat er aan de hand is, waarom dit debat nu plaatsvindt, en wat de huidige stand van zaken is. Gebruik de gevonden Kamerbrief/nota en nieuwsberichten.

## Politieke verhoudingen
Beschrijf per relevante fractie hun positie, stemgedrag en waar ze tegenover de partij staan - inclusief de positie van de minister. Vergelijk met het eigen partijstandpunt.

## Interruptiestrategie
Analyseer op basis van de politieke verhoudingen de zwakke punten van de minister en andere fracties. Beschrijf per relevante tegenstander hun verwachte positie, het zwakke punt, en een concrete interruptie met bronverwijzing.

## Conceptmoties
Formuleer 2-3 moties die aansluiten bij het partijstandpunt en kansrijk zijn voor een meerderheid. Schrijf per motie:
- Dictum: "verzoekt de regering..." of "spreekt uit dat..."
- Toelichting: 2 zinnen
- Verwachte steun: welke fracties waarschijnlijk voor/tegen`,
  },
  {
    soort: "Commissiedebat",
    label: "Commissiedebat",
    steps: ["Overzicht agendapunten", "Analyse per agendapunt", "Openstaande toezeggingen", "Standpunten fracties"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek alle Kamerbrieven en beleidsdocumenten die op de agenda staan (gebruik beide voor bredere dekking)
- searchDocumenten: zoek aanvullende brieven en nota's
- searchToezeggingen: zoek openstaande toezeggingen van de minister
- searchStemmingen: zoek stemgedrag van fracties
- getRecenteKamervragen: zoek recente schriftelijke vragen over dit onderwerp
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Commissiedebat - hier gebeurt het echte beleidswerk, meer ruimte voor inhoud dan plenair.

## Briefing
Schrijf de briefing met deze secties:

## Overzicht agendapunten
Geef per document het nummer, titel, datum en een beknopte samenvatting van de inhoud.

## Analyse per agendapunt
Vergelijk de stukken met het partijstandpunt. Geef per agendapunt kritische kanttekeningen (wat ontbreekt, wat is zwak) en 2-3 concrete vragen voor de minister met documentverwijzing.

## Openstaande toezeggingen
Geef per toezegging de datum, inhoud en status (nagekomen of niet nagekomen).

## Standpunten fracties
Beschrijf per relevante fractie hun positie en stemgedrag.`,
  },
  {
    soort: "Wetgevingsoverleg",
    label: "Wetgevingsoverleg",
    steps: ["Wetsvoorstel & advies RvS", "Artikelanalyse", "Amendementen", "Juridische kanttekeningen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek het wetsvoorstel, de Memorie van Toelichting en het advies van de Raad van State (gebruik beide voor bredere dekking)
- searchKamerstukken: zoek gerelateerde Kamerstukken en amendementen
- searchDocumenten: zoek uitvoeringstoetsen en adviezen van betrokken instanties
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Wetgevingsoverleg - artikel-voor-artikel bespreking van een wetsvoorstel, juridische precisie is essentieel.

## Briefing
Schrijf de briefing met deze secties:

## Wetsvoorstel & advies RvS
Beschrijf wat het wetsvoorstel regelt, waarom het nodig is, en wat de hoofdpunten zijn van het RvS-advies met de reactie van de regering.

## Artikelanalyse
Analyseer de belangrijkste artikelen en vergelijk ze met het partijstandpunt. Beschrijf per relevant artikel wat het regelt, de impact voor burgers, bedrijven en uitvoeringsorganisaties, en eventuele bezwaren.

## Amendementen
Geef een overzicht van ingediende amendementen (indiener, artikel, strekking). Formuleer daarnaast 1-3 eigen conceptamendementen met artikelnummer, voorgestelde wijziging en toelichting.

## Juridische kanttekeningen
Beschrijf mogelijke conflicten met de Grondwet, EU-recht, het EVRM of bestaande wetgeving.`,
  },
  {
    soort: "Tweeminutendebat",
    label: "Tweeminutendebat",
    steps: ["Terugblik commissiedebat", "Onopgeloste punten", "Conceptmoties"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchHandelingen: zoek het voorafgaande commissiedebat
- searchToezeggingen: zoek toezeggingen van de minister op dit dossier
- searchStemmingen: zoek steunpatronen bij vergelijkbare moties
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Tweeminutendebat - maximaal 2 minuten spreektijd, volgt op een eerder commissiedebat, alleen ruimte voor een motie.

## Briefing
Schrijf de briefing met deze secties:

## Terugblik commissiedebat
Beschrijf de uitkomst van het debat, de gedane toezeggingen en wat onbevredigend bleef.

## Onopgeloste punten
Analyseer wat onopgelost bleef en waar een motie verschil kan maken. Beschrijf de concrete punten waar het Kamerlid actie op kan ondernemen.

## Conceptmoties
Formuleer maximaal 2 moties:
- Dictum: "verzoekt de regering..." of "spreekt uit dat..."
- Toelichting: 2 zinnen
- Verwachte steun: welke fracties voor/tegen`,
  },
  {
    soort: "Notaoverleg",
    label: "Notaoverleg",
    steps: ["Samenvatting nota", "Analyse per hoofdpunt", "Beleidsalternatieven"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek de nota of beleidsbrief die centraal staat (gebruik beide voor bredere dekking)
- searchDocumenten: zoek reacties van belangenorganisaties en uitvoerbaarheidsanalyses
- searchNews: zoek actueel nieuws over het onderwerp
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Notaoverleg - debat over een specifieke beleidsnota of beleidsbrief van de minister.

## Briefing
Schrijf de briefing met deze secties:

## Samenvatting nota
Beschrijf het doel van de nota, de voorgestelde maatregelen en de financiele onderbouwing.

## Analyse per hoofdpunt
Beschrijf per hoofdpunt de voorgestelde maatregel, de beoordeling vanuit het partijstandpunt (wat is goed, wat ontbreekt) en de verwachte impact.

## Beleidsalternatieven
Beschrijf alternatieve maatregelen die beter passen bij de partijvisie - per alternatief: wat het inhoudt, waarom het beter is, en hoe het te realiseren is.`,
  },
  {
    soort: "Begrotingsoverleg",
    label: "Begrotingsoverleg",
    steps: ["Begrotingsanalyse", "Rekenkamer & CPB", "Begrotingsamendementen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek de begrotingsstukken en Rekenkamer/CPB-rapporten (gebruik beide voor bredere dekking)
- searchDocumenten: zoek aanvullende begrotingsdocumenten en doorrekeningen
- searchKamerstukken: zoek ingediende amendementen van andere fracties
- searchPartyDocs: zoek de financiele prioriteiten van de partij

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Begrotingsoverleg - debat over de begroting van een specifiek ministerie, het draait om euro's.

## Briefing
Schrijf de briefing met deze secties:

## Begrotingsanalyse
Geef een totaalbeeld van de begroting en beschrijf per opvallende post: naam, bedrag, verschuiving t.o.v. vorig jaar, en beoordeling. Vergelijk met de financiele prioriteiten van de partij.

## Rekenkamer & CPB
Beschrijf de relevante bevindingen: doelmatigheid, effectiviteit en risico's.

## Begrotingsamendementen
Geef een overzicht van ingediende amendementen. Formuleer daarnaast 1-2 eigen begrotingsamendementen met: welke post wordt gewijzigd, het bedrag erbij of eraf, de dekking en de toelichting.`,
  },
  {
    soort: "Rondetafelgesprek",
    label: "Rondetafelgesprek",
    steps: ["Achtergrond", "Profiel per genodigde", "Informatiebehoefte"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek parlementaire documenten over het onderwerp en de aanleiding (gebruik beide voor bredere dekking)
- searchNews: zoek actueel nieuws en publicaties van genodigden
- fetchWebPage: bekijk websites van genodigde organisaties/experts
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Rondetafelgesprek - de commissie spreekt met experts en belanghebbenden. Er is geen minister aanwezig; dit is intelligence-gathering.

## Briefing
Schrijf de briefing met deze secties:

## Achtergrond
Beschrijf het onderwerp, de aanleiding en welke beleidsvragen centraal staan.

## Profiel per genodigde
Beschrijf per genodigde: naam en functie, achtergrond, bekende standpunten, en 2-3 gerichte vragen die relevante informatie opleveren voor de fractie.

## Informatiebehoefte
Beschrijf welke informatie uit dit gesprek moet komen voor toekomstige debatten en lever een geprioriteerde vragenlijst over alle genodigden heen.`,
  },
  {
    soort: "Procedurevergadering",
    label: "Procedurevergadering",
    steps: ["Agendaoverzicht", "Aanbevelingen per punt", "Suggesties eigen agendering"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchAgenda: zoek de conceptagenda of besluitenlijst van deze procedurevergadering
- searchParlement + searchOpenTK: zoek achtergrond bij de voorgestelde agendapunten (gebruik beide voor bredere dekking)
- searchNews: zoek actuele ontwikkelingen voor eigen agenderingssuggesties
- searchPartyDocs: zoek de prioriteiten van de fractie`,
    userPrompt: `Procedurevergadering - hier wordt de commissieagenda bepaald. Strategisch belangrijk: de fractie kan invloed uitoefenen op wat er wel en niet besproken wordt.

## Briefing
Schrijf de briefing met deze secties:

## Agendaoverzicht
Geef een overzicht van alle agendapunten met korte context per punt.

## Aanbevelingen per punt
Geef per agendapunt aan wat wordt voorgesteld en doe een aanbeveling (agenderen, niet agenderen, steunen, of rapporteur aanbieden) met onderbouwing.

## Suggesties eigen agendering
Beschrijf per suggestie het onderwerp en waarom het nu relevant is om dit te agenderen.`,
  },
  {
    soort: "Technische briefing",
    label: "Technische briefing",
    steps: ["Achtergrond", "Kernvragen", "Aandachtspunten fractie"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek parlementaire documenten en rapporten over het onderwerp (gebruik beide voor bredere dekking)
- searchNews: zoek actueel nieuws over het onderwerp
- getRecenteKamervragen: zoek welke Kamervragen er eerder over dit onderwerp zijn gesteld
- searchPartyDocs: zoek de relevante partijstandpunten

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Technische briefing - experts of ambtenaren informeren de commissie over een technisch onderwerp. Geen politiek debat, maar een kans om de materie te doorgronden.

## Briefing
Schrijf de briefing met deze secties:

## Achtergrond
Beschrijf wat het onderwerp is, waarom het technisch complex is, wat de politieke relevantie is en welke organisatie de briefing geeft.

## Kernvragen
Formuleer 10-15 inhoudelijke vragen geordend per thema, gericht op het doorgronden van de materie. Baseer deze op ontbrekende informatie uit eerdere Kamervragen.

## Aandachtspunten fractie
Beschrijf welke aspecten raken aan de partijpositie of lopende debatten en waar het Kamerlid extra op moet letten.`,
  },
  {
    soort: "Gesprek",
    label: "Gesprek",
    steps: ["Gesprekspartners", "Gespreksagenda", "Strategische vragen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek parlementaire documenten over het gespreksonderwerp (gebruik beide voor bredere dekking)
- searchNews: zoek actueel nieuws en recente publicaties van gesprekspartners
- fetchWebPage: bekijk websites van gesprekspartners
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Gesprek - informeel overleg met externe partijen of belanghebbenden. Goede voorbereiding is essentieel: weet met wie je praat, wat zij willen, en wat jij van hen nodig hebt.

## Briefing
Schrijf de briefing met deze secties:

## Gesprekspartners
Beschrijf per genodigde: naam en functie, achtergrond, bekende standpunten, en wat hun belang is in dit gesprek.

## Gespreksagenda
Beschrijf de verwachte thema's en hoe ze raken aan de partijpositie.

## Strategische vragen
Formuleer 5-10 vragen geordend op prioriteit, gericht op het verkrijgen van informatie die de fractie kan inzetten in toekomstige debatten.`,
  },
  {
    soort: "Stemmingen",
    label: "Stemmingen",
    steps: ["Overzicht", "Stemadvies per item", "Gevoelige stemmingen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek de moties, amendementen en wetsvoorstellen die in stemming komen (gebruik beide voor bredere dekking)
- searchStemmingen: zoek eerdere stempatronen op gerelateerde onderwerpen
- searchPartyDocs: zoek het partijstandpunt
- searchNews: zoek mediaberichten over gevoelige stemmingen

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Stemmingen - de Kamer stemt over moties, amendementen en wetsvoorstellen.

## Briefing
Schrijf de briefing met deze secties:

## Overzicht
Beschrijf hoeveel stemmingen er zijn, over welke thema's, en welke de belangrijkste zijn.

## Stemadvies per item
Geef per motie, amendement of wetsvoorstel: nummer en indiener, strekking (1-2 zinnen), stemadvies (voor/tegen/onthouden) en onderbouwing vanuit het partijstandpunt.

## Gevoelige stemmingen
Beschrijf stemmingen die politiek risico dragen, mediagevoelig zijn of onverwachte bondgenoten opleveren. Geef per gevoelige stemming aan wat het risico is en hoe te handelen.`,
  },
  {
    soort: "Regeling van werkzaamheden",
    label: "Regeling van werkzaamheden",
    steps: ["Overzicht", "Lopende debataanvragen", "Mogelijke eigen aanvragen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchAgenda: zoek de huidige plenaire planning en recente debataanvragen
- searchParlement + searchOpenTK: zoek recente Kamerbrieven die als aanleiding kunnen dienen (gebruik beide voor bredere dekking)
- searchNews: zoek actueel nieuws voor urgente onderwerpen
- searchPartyDocs: zoek de thema's en prioriteiten van de fractie`,
    userPrompt: `Regeling van werkzaamheden - kort plenair overleg voor debataanvragen en procedurele verzoeken.

## Briefing
Schrijf de briefing met deze secties:

## Overzicht
Beschrijf wat er op de agenda staat en welke kansen er liggen.

## Lopende debataanvragen
Beschrijf per aanvraag: aanvrager, onderwerp en status (wel/niet gesteund, wel/niet ingepland).

## Mogelijke eigen aanvragen
Beschrijf per suggestie: het onderwerp, de aanleiding, waarom dit nu een debat verdient, en welke fracties het waarschijnlijk steunen.`,
  },
  {
    soort: "Werkbezoek",
    label: "Werkbezoek",
    steps: ["Organisatie-achtergrond", "Beleidsontwikkelingen", "Vragenlijst", "Mediakansen"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- fetchWebPage: bekijk de website van de organisatie
- searchParlement + searchOpenTK: zoek gerelateerde Kamervragen en debatten (gebruik beide voor bredere dekking)
- searchNews: zoek recent nieuws over deze organisatie of sector
- searchPartyDocs: zoek het partijstandpunt op dit beleidsterrein

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Werkbezoek - Kamerleden bezoeken een organisatie of instelling om ervaringen uit de praktijk op te halen.

## Briefing
Schrijf de briefing met deze secties:

## Organisatie-achtergrond
Beschrijf wat de organisatie doet, hoeveel mensen er werken, hoe het wordt gefinancierd en wat de relatie is tot het rijksbeleid.

## Beleidsontwikkelingen
Beschrijf recente wetswijzigingen, bezuinigingen, investeringen of beleidswijzigingen die deze organisatie raken.

## Vragenlijst
Formuleer 10-15 vragen voor gesprekken ter plaatse, gericht op het ophalen van ervaringen uit de praktijk die bruikbaar zijn in Kamerdebatten.

## Mediakansen
Beschrijf mogelijke fotomomenten, quotes of bevindingen die de fractie kan inzetten voor communicatie en sociale media.`,
  },
  {
    soort: "Petitieaanbieding",
    label: "Petitieaanbieding",
    steps: ["Achtergrond petitie", "Profiel indiener", "Beleidscontext", "Vragen & aandachtspunten"],
    basePrompt: `## Onderzoek
Voer ALLE zoekacties tegelijk uit in een enkele ronde:
- searchParlement + searchOpenTK: zoek relevante Kamerbrieven, wetsvoorstellen en eerdere debatten over het onderwerp (gebruik beide voor bredere dekking)
- searchNews: zoek nieuws over de petitie en de indiener
- fetchWebPage: bekijk de website van de organisatie of het initiatief
- searchPartyDocs: zoek het partijstandpunt

Haal daarna de volledige tekst op van de belangrijkste documenten met getDocumentText of getOpenTKDocument.`,
    userPrompt: `Petitieaanbieding - burgers of organisaties bieden een petitie aan bij de Kamer. Het Kamerlid ontvangt de petitie namens de commissie en moet weten wie er voor hem staat en wat ze willen.

## Briefing
Schrijf de briefing met deze secties:

## Achtergrond petitie
Beschrijf de kern van het verzoek, de omvang van het draagvlak en de context waarin de petitie is gestart.

## Profiel indiener
Beschrijf wat de organisatie doet, wie erachter zitten, hoe groot ze zijn, hoe ze worden gefinancierd, en of ze eerder petities of lobbycampagnes hebben gevoerd.

## Beleidscontext
Beschrijf de huidige stand van het beleid, wat de regering al doet of van plan is, en hoe het partijstandpunt zich verhoudt tot het verzoek in de petitie.

## Vragen & aandachtspunten
Formuleer 5-10 vragen die het Kamerlid kan stellen bij de ontvangst of kan meenemen naar een volgend debat. Beschrijf ook eventuele risico's of gevoeligheden.`,
  },
]

/** Get the combined skill prompt (base + user) for a given meeting type */
export function getDefaultSkill(soort: string): string {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  if (!skill) return ""
  return `${skill.userPrompt}\n\n${skill.basePrompt}`
}

/** Get only the base (technical) prompt for a given meeting type */
export function getBasePrompt(soort: string): string {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  return skill?.basePrompt ?? ""
}

/** Get only the user-editable prompt for a given meeting type */
export function getDefaultUserPrompt(soort: string): string {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  return skill?.userPrompt ?? ""
}

/** Combine a user prompt override with the base prompt */
export function assembleSkillPrompt(soort: string, userPromptOverride?: string): string {
  const base = getBasePrompt(soort)
  const user = userPromptOverride || getDefaultUserPrompt(soort)
  if (!base && !user) return ""
  return `${user}\n\n${base}`
}

/** Get the default progress steps for a given meeting type */
export function getDefaultSteps(soort: string): string[] {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  return skill?.steps ?? []
}

/** Get all meeting type keys that have a skill */
export function getMeetingTypes(): string[] {
  return MEETING_SKILLS.map((s) => s.soort)
}
