/**
 * Default "skills" (prompt instructions) per vergadertype.
 * Users can override these in Settings.
 *
 * Each skill has a `steps` array — these are the deliverable section names
 * that appear as ## headers in the output AND as progress steps in the sidebar.
 */

export type MeetingSkill = {
  soort: string
  label: string
  prompt: string
  steps: string[]
}

export const MEETING_SKILLS: MeetingSkill[] = [
  {
    soort: "Plenair debat",
    label: "Plenair debat",
    steps: ["Aanleiding & context", "Politieke verhoudingen", "Interruptiestrategie", "Conceptmoties"],
    prompt: `Plenair debat - het meest zichtbare format, media kijken mee, moties worden ingediend.


Stap 1 - Aanleiding & context:
Zoek via searchParlement de Kamerbrief, nota of gebeurtenis die tot dit debat heeft geleid. Haal de volledige tekst op via getDocumentText. Zoek via searchNews de actuele media-invalshoek.
Schrijf: wat er aan de hand is, waarom dit debat nu plaatsvindt, huidige stand van zaken, media-context.

Stap 2 - Politieke verhoudingen:
Zoek via searchStemmingen stempatronen van fracties op dit dossier. Zoek via searchHandelingen eerdere uitspraken van de minister. Zoek via searchPartyDocs het partijstandpunt.
Schrijf: per relevante fractie hun positie, stemgedrag en waar ze tegenover de partij staan. Inclusief de positie van de minister.

Stap 3 - Interruptiestrategie:
Analyseer op basis van stap 2 de zwakke punten van de minister en andere fracties.
Schrijf: per relevante tegenstander hun verwachte positie, het zwakke punt, en een concrete interruptie met bronverwijzing.

Stap 4 - Conceptmoties:
Formuleer 2-3 moties die aansluiten bij het partijstandpunt en kansrijk zijn voor een meerderheid.
Schrijf per motie:
- Dictum: "verzoekt de regering..." of "spreekt uit dat..."
- Toelichting: 2 zinnen
- Verwachte steun: welke fracties waarschijnlijk voor/tegen`,
  },
  {
    soort: "Commissiedebat",
    label: "Commissiedebat",
    steps: ["Overzicht agendapunten", "Analyse per agendapunt", "Openstaande toezeggingen", "Standpunten fracties"],
    prompt: `Commissiedebat - hier gebeurt het echte beleidswerk, meer ruimte voor inhoud dan plenair.


Stap 1 - Overzicht agendapunten:
Zoek via searchParlement naar alle agendastukken (bijv. "Kamerbrief [beleidsterrein]"). Haal de volledige teksten op via getDocumentText.
Schrijf: per document het nummer, titel, datum, en een beknopte samenvatting van de inhoud.

Stap 2 - Analyse per agendapunt:
Vergelijk de stukken met het partijstandpunt via searchPartyDocs. Zoek via getRecenteKamervragen naar recent gestelde vragen.
Schrijf per agendapunt: kritische kanttekeningen (wat ontbreekt, wat is zwak), en 2-3 concrete vragen voor de minister met documentverwijzing.

Stap 3 - Openstaande toezeggingen:
Zoek via searchToezeggingen naar toezeggingen op dit beleidsterrein.
Schrijf per toezegging: datum, inhoud, status (nagekomen/niet nagekomen).

Stap 4 - Standpunten fracties:
Zoek via searchStemmingen en searchHandelingen naar posities van fracties.
Schrijf per relevante fractie: hun positie en stemgedrag op dit dossier.`,
  },
  {
    soort: "Wetgevingsoverleg",
    label: "Wetgevingsoverleg",
    steps: ["Wetsvoorstel & advies RvS", "Artikelanalyse", "Amendementen", "Juridische kanttekeningen"],
    prompt: `Wetgevingsoverleg - artikel-voor-artikel bespreking van een wetsvoorstel, juridische precisie is essentieel.


Stap 1 - Wetsvoorstel & advies RvS:
Zoek via searchParlement het wetsvoorstel, de Memorie van Toelichting en het advies van de Raad van State. Haal volledige teksten op via getDocumentText.
Schrijf: wat het wetsvoorstel regelt, waarom het nodig is, en de hoofdpunten van het RvS-advies met de reactie van de regering.

Stap 2 - Artikelanalyse:
Analyseer de belangrijkste artikelen. Vergelijk met het partijstandpunt via searchPartyDocs.
Schrijf per relevant artikel: wat het regelt, impact voor burgers/bedrijven/uitvoering, en bezwaren.

Stap 3 - Amendementen:
Zoek via searchKamerstukken naar ingediende amendementen van andere fracties. Formuleer 1-3 eigen conceptamendementen.
Schrijf: overzicht ingediende amendementen (indiener, artikel, strekking), gevolgd door conceptamendementen met artikelnummer, wijziging en toelichting.

Stap 4 - Juridische kanttekeningen:
Zoek via searchDocumenten naar uitvoeringstoetsen of adviezen. Analyseer juridische risico's.
Schrijf: mogelijke conflicten met Grondwet, EU-recht, EVRM of bestaande wetgeving.`,
  },
  {
    soort: "Tweeminutendebat",
    label: "Tweeminutendebat",
    steps: ["Terugblik commissiedebat", "Onopgeloste punten", "Conceptmoties"],
    prompt: `Tweeminutendebat - max 2 minuten, volgt op een eerder commissiedebat, alleen ruimte voor een motie.


Stap 1 - Terugblik commissiedebat:
Zoek via searchParlement of searchHandelingen het voorafgaande commissiedebat. Zoek via searchToezeggingen de gedane toezeggingen.
Schrijf: uitkomst van het debat, gedane toezeggingen, wat onbevredigend bleef.

Stap 2 - Onopgeloste punten:
Analyseer wat onopgelost bleef en waar een motie verschil kan maken.
Schrijf: concrete punten waar het Kamerlid actie op kan ondernemen.

Stap 3 - Conceptmoties:
Zoek via searchStemmingen steunpatronen voor vergelijkbare moties. Zoek via searchPartyDocs het partijstandpunt.
Schrijf per motie (max 2):
- Dictum: "verzoekt de regering..." of "spreekt uit dat..."
- Toelichting: 2 zinnen
- Verwachte steun: welke fracties voor/tegen`,
  },
  {
    soort: "Notaoverleg",
    label: "Notaoverleg",
    steps: ["Samenvatting nota", "Analyse per hoofdpunt", "Beleidsalternatieven"],
    prompt: `Notaoverleg - debat over een specifieke beleidsnota of beleidsbrief van de minister.


Stap 1 - Samenvatting nota:
Zoek via searchParlement de nota/beleidsbrief die centraal staat. Haal de volledige tekst op via getDocumentText.
Schrijf: doel van de nota, voorgestelde maatregelen, financiele onderbouwing.

Stap 2 - Analyse per hoofdpunt:
Vergelijk met het partijstandpunt via searchPartyDocs. Zoek via searchNews reacties van belangenorganisaties. Zoek via searchDocumenten uitvoerbaarheidsanalyses.
Schrijf per hoofdpunt: maatregel, beoordeling vanuit partijstandpunt (wat is goed, wat ontbreekt), verwachte impact.

Stap 3 - Beleidsalternatieven:
Analyseer vanuit het partijprogramma welke alternatieven er zijn.
Schrijf: alternatieve maatregelen die beter passen bij de partijvisie. Per alternatief: wat, waarom, en hoe te realiseren.`,
  },
  {
    soort: "Begrotingsoverleg",
    label: "Begrotingsoverleg",
    steps: ["Begrotingsanalyse", "Rekenkamer & CPB", "Begrotingsamendementen"],
    prompt: `Begrotingsoverleg - debat over de begroting van een specifiek ministerie, het draait om euro's.


Stap 1 - Begrotingsanalyse:
Zoek via searchParlement de begrotingsstukken. Haal op via getDocumentText. Zoek via searchPartyDocs de financiele prioriteiten van de partij.
Schrijf: totaalbeeld van de begroting, en per opvallende post: naam, bedrag, verschuiving t.o.v. vorig jaar, en beoordeling.

Stap 2 - Rekenkamer & CPB:
Zoek via searchDocumenten rapporten van de Algemene Rekenkamer en CPB-doorrekeningen.
Schrijf: relevante bevindingen over dit beleidsterrein - doelmatigheid, effectiviteit, risico's.

Stap 3 - Begrotingsamendementen:
Zoek via searchKamerstukken naar amendementen van andere fracties.
Schrijf 1-2 eigen begrotingsamendementen. Per amendement: welke post, bedrag erbij/eraf, dekking (verschuiving binnen begroting), toelichting.`,
  },
  {
    soort: "Rondetafelgesprek",
    label: "Rondetafelgesprek",
    steps: ["Achtergrond", "Profiel per genodigde", "Informatiebehoefte"],
    prompt: `Rondetafelgesprek - de commissie spreekt met experts en belanghebbenden, geen minister aanwezig, dit is intelligence-gathering.


Stap 1 - Achtergrond:
Zoek via searchParlement naar de agenda en achtergrond van dit rondetafelgesprek.
Schrijf: onderwerp, waarom het is georganiseerd, welke beleidsvragen centraal staan.

Stap 2 - Profiel per genodigde:
Zoek per genodigde via searchNews en fetchWebPage naar hun standpunten en publicaties. Zoek via searchDocumenten naar rapporten van deze organisaties.
Schrijf per expert/organisatie: naam en functie, achtergrond, bekende standpunten, en 2-3 gerichte vragen.

Stap 3 - Informatiebehoefte:
Zoek via searchPartyDocs welke informatie de fractie nodig heeft op dit dossier.
Schrijf: welke informatie uit dit gesprek moet komen voor toekomstige debatten, geprioriteerde vragenlijst over alle genodigden heen.`,
  },
  {
    soort: "Procedurevergadering",
    label: "Procedurevergadering",
    steps: ["Agendaoverzicht", "Aanbevelingen per punt", "Suggesties eigen agendering"],
    prompt: `Procedurevergadering - hier wordt de commissieagenda bepaald, strategisch belangrijk voor de fractie.


Stap 1 - Agendaoverzicht:
Zoek via searchParlement of searchAgenda de conceptagenda/besluitenlijst. Zoek achtergrond bij voorgestelde punten via searchDocumenten.
Schrijf: overzicht van alle agendapunten met korte context per punt.

Stap 2 - Aanbevelingen per punt:
Zoek via searchPartyDocs welke onderwerpen prioriteit hebben. Zoek via searchNews actuele ontwikkelingen.
Schrijf per agendapunt: wat wordt voorgesteld, en aanbeveling (agenderen/niet agenderen/steunen/rapporteur) met onderbouwing.

Stap 3 - Suggesties eigen agendering:
Analyseer welke onderwerpen de fractie zelf kan agenderen.
Schrijf: onderwerpen die de fractie kan voorstellen voor een debat of overleg, met onderbouwing waarom dit nu relevant is.`,
  },
  {
    soort: "Technische briefing",
    label: "Technische briefing",
    steps: ["Achtergrond", "Kernvragen", "Aandachtspunten fractie"],
    prompt: `Technische briefing - experts informeren de commissie over een technisch onderwerp, geen politiek debat.


Stap 1 - Achtergrond:
Zoek via searchParlement en searchDocumenten naar het onderwerp en gerelateerde rapporten. Zoek via searchNews actuele context.
Schrijf: wat het onderwerp is, waarom het technisch complex is, politieke relevantie, welke organisatie de briefing geeft.

Stap 2 - Kernvragen:
Zoek via getRecenteKamervragen eerder gestelde vragen. Analyseer welke informatie nog ontbreekt.
Schrijf: 10-15 inhoudelijke vragen geordend per thema, gericht op het doorgronden van de materie.

Stap 3 - Aandachtspunten fractie:
Zoek via searchPartyDocs relevante partijstandpunten.
Schrijf: welke aspecten raken aan partijstandpunten of lopende debatten, waar het Kamerlid extra op moet letten.`,
  },
  {
    soort: "Gesprek",
    label: "Gesprek",
    steps: ["Gesprekspartners", "Gespreksagenda", "Strategische vragen"],
    prompt: `Gesprek - informeel overleg met externe partijen, goede voorbereiding is essentieel.


Stap 1 - Gesprekspartners:
Zoek via searchParlement en searchNews de gesprekspartner(s). Zoek via fetchWebPage hun website en publicaties.
Schrijf per genodigde: naam en functie, achtergrond, bekende standpunten, en wat hun belang is in dit gesprek.

Stap 2 - Gespreksagenda:
Zoek via searchDocumenten relevante beleidsontwikkelingen. Zoek via searchPartyDocs het partijstandpunt.
Schrijf: verwachte thema's en hoe ze raken aan het partijstandpunt.

Stap 3 - Strategische vragen:
Analyseer welke informatie politiek bruikbaar is.
Schrijf: 5-10 vragen geordend op prioriteit, gericht op het verkrijgen van politiek bruikbare informatie.`,
  },
  {
    soort: "Stemmingen",
    label: "Stemmingen",
    steps: ["Overzicht", "Stemadvies per item", "Gevoelige stemmingen"],
    prompt: `Stemmingen - de Kamer stemt over moties, amendementen en wetsvoorstellen.


Stap 1 - Overzicht:
Zoek via searchStemmingen en searchKamerstukken welke items in stemming komen. Haal teksten op via getDocumentText.
Schrijf: hoeveel stemmingen, over welke thema's, wat zijn de belangrijkste.

Stap 2 - Stemadvies per item:
Zoek via searchPartyDocs het partijstandpunt per thema. Zoek via searchHandelingen de debatcontext.
Schrijf per motie/amendement/wetsvoorstel: nummer en indiener, strekking (1-2 zinnen), stemadvies (voor/tegen/onthouden), onderbouwing vanuit partijstandpunt.

Stap 3 - Gevoelige stemmingen:
Zoek via searchNews of er media-aandacht is voor specifieke stemmingen.
Schrijf: stemmingen met politiek risico, media-gevoeligheid, of onverwachte bondgenoten. Per gevoelige stemming: risico en hoe te handelen.`,
  },
  {
    soort: "Regeling van werkzaamheden",
    label: "Regeling van werkzaamheden",
    steps: ["Overzicht", "Lopende debataanvragen", "Mogelijke eigen aanvragen"],
    prompt: `Regeling van werkzaamheden - kort plenair overleg voor debataanvragen en procedurele verzoeken.


Stap 1 - Overzicht:
Zoek via searchAgenda en searchParlement de huidige planning en recente debataanvragen.
Schrijf: wat er op de agenda staat, welke kansen er liggen.

Stap 2 - Lopende debataanvragen:
Zoek via searchParlement recente debataanvragen van alle fracties.
Schrijf per aanvraag: aanvrager, onderwerp, status (wel/niet gesteund, wel/niet ingepland).

Stap 3 - Mogelijke eigen aanvragen:
Zoek via searchNews urgente onderwerpen. Zoek via searchPartyDocs fractiethema's. Zoek via searchKamerstukken recente Kamerbrieven als aanleiding.
Schrijf per suggestie: onderwerp, aanleiding, onderbouwing waarom dit nu een debat verdient, verwachte steun van andere fracties.`,
  },
  {
    soort: "Werkbezoek",
    label: "Werkbezoek",
    steps: ["Organisatie-achtergrond", "Beleidsontwikkelingen", "Vragenlijst", "Mediakansen"],
    prompt: `Werkbezoek - Kamerleden bezoeken een organisatie of instelling om ervaringen uit de praktijk op te halen.


Stap 1 - Organisatie-achtergrond:
Zoek via fetchWebPage de website van de organisatie. Zoek via searchParlement gerelateerde Kamervragen en debatten.
Schrijf: wat de organisatie doet, hoeveel mensen er werken, financiering, relatie tot rijksbeleid.

Stap 2 - Beleidsontwikkelingen:
Zoek via searchDocumenten relevante beleidswijzigingen. Zoek via searchNews recent nieuws.
Schrijf: recente wetswijzigingen, bezuinigingen, investeringen of beleidswijzigingen die deze organisatie raken.

Stap 3 - Vragenlijst:
Zoek via searchPartyDocs het partijstandpunt op dit beleidsterrein.
Schrijf: 10-15 vragen voor gesprekken ter plaatse, gericht op ervaringen uit de praktijk die bruikbaar zijn in Kamerdebatten.

Stap 4 - Mediakansen:
Analyseer welke bevindingen mediageniek zijn.
Schrijf: mogelijke fotomomenten, quotes of bevindingen voor communicatie en sociale media.`,
  },
]

/** Get the default skill prompt for a given meeting type */
export function getDefaultSkill(soort: string): string {
  const skill = MEETING_SKILLS.find((s) => s.soort === soort)
  return skill?.prompt ?? ""
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
