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
    prompt: `Plenair debat - het meest zichtbare format in de Kamer. Media kijken mee, interrupties zijn scherp, moties worden ingediend.

Stap 1 - Aanleiding & context:
Zoek de Kamerbrief, nota of gebeurtenis die tot dit debat heeft geleid en lees de volledige tekst. Bekijk ook het actuele nieuws voor de media-invalshoek. Beschrijf wat er aan de hand is, waarom dit debat nu plaatsvindt, en wat de huidige stand van zaken is.

Stap 2 - Politieke verhoudingen:
Onderzoek hoe de fracties op dit dossier hebben gestemd en wat de minister er eerder over heeft gezegd in debatten. Vergelijk met het eigen partijstandpunt. Beschrijf per relevante fractie hun positie, stemgedrag en waar ze tegenover de partij staan - inclusief de positie van de minister.

Stap 3 - Interruptiestrategie:
Analyseer op basis van de politieke verhoudingen de zwakke punten van de minister en andere fracties. Beschrijf per relevante tegenstander hun verwachte positie, het zwakke punt, en een concrete interruptie met bronverwijzing.

Stap 4 - Conceptmoties:
Formuleer 2-3 moties die aansluiten bij het partijstandpunt en kansrijk zijn voor een meerderheid. Schrijf per motie:
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
Zoek alle Kamerbrieven en beleidsdocumenten die op de agenda staan en lees de volledige teksten. Geef per document het nummer, titel, datum en een beknopte samenvatting van de inhoud.

Stap 2 - Analyse per agendapunt:
Vergelijk de stukken met het partijstandpunt. Bekijk ook welke schriftelijke vragen er recent over dit onderwerp zijn gesteld. Geef per agendapunt kritische kanttekeningen (wat ontbreekt, wat is zwak) en 2-3 concrete vragen voor de minister met documentverwijzing.

Stap 3 - Openstaande toezeggingen:
Zoek op welke toezeggingen de minister eerder heeft gedaan op dit beleidsterrein. Geef per toezegging de datum, inhoud en status (nagekomen of niet nagekomen).

Stap 4 - Standpunten fracties:
Onderzoek hoe de verschillende fracties op dit dossier hebben gestemd en wat ze in eerdere debatten hebben gezegd. Beschrijf per relevante fractie hun positie en stemgedrag.`,
  },
  {
    soort: "Wetgevingsoverleg",
    label: "Wetgevingsoverleg",
    steps: ["Wetsvoorstel & advies RvS", "Artikelanalyse", "Amendementen", "Juridische kanttekeningen"],
    prompt: `Wetgevingsoverleg - artikel-voor-artikel bespreking van een wetsvoorstel, juridische precisie is essentieel.

Stap 1 - Wetsvoorstel & advies RvS:
Zoek het wetsvoorstel, de Memorie van Toelichting en het advies van de Raad van State op en lees de volledige teksten. Beschrijf wat het wetsvoorstel regelt, waarom het nodig is, en wat de hoofdpunten zijn van het RvS-advies met de reactie van de regering.

Stap 2 - Artikelanalyse:
Analyseer de belangrijkste artikelen en vergelijk ze met het partijstandpunt. Beschrijf per relevant artikel wat het regelt, de impact voor burgers, bedrijven en uitvoeringsorganisaties, en eventuele bezwaren.

Stap 3 - Amendementen:
Zoek welke amendementen andere fracties al hebben ingediend. Formuleer daarnaast 1-3 eigen conceptamendementen. Geef een overzicht van ingediende amendementen (indiener, artikel, strekking), gevolgd door de eigen conceptamendementen met artikelnummer, voorgestelde wijziging en toelichting.

Stap 4 - Juridische kanttekeningen:
Zoek uitvoeringstoetsen en adviezen van betrokken instanties op. Beschrijf mogelijke conflicten met de Grondwet, EU-recht, het EVRM of bestaande wetgeving.`,
  },
  {
    soort: "Tweeminutendebat",
    label: "Tweeminutendebat",
    steps: ["Terugblik commissiedebat", "Onopgeloste punten", "Conceptmoties"],
    prompt: `Tweeminutendebat - maximaal 2 minuten spreektijd, volgt op een eerder commissiedebat, alleen ruimte voor een motie.

Stap 1 - Terugblik commissiedebat:
Zoek het voorafgaande commissiedebat op en bekijk welke toezeggingen de minister toen heeft gedaan. Beschrijf de uitkomst van het debat, de gedane toezeggingen en wat onbevredigend bleef.

Stap 2 - Onopgeloste punten:
Analyseer wat onopgelost bleef en waar een motie verschil kan maken. Beschrijf de concrete punten waar het Kamerlid actie op kan ondernemen.

Stap 3 - Conceptmoties:
Onderzoek steunpatronen bij vergelijkbare moties en vergelijk met het partijstandpunt. Formuleer maximaal 2 moties:
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
Zoek de nota of beleidsbrief die centraal staat op en lees de volledige tekst. Beschrijf het doel van de nota, de voorgestelde maatregelen en de financiele onderbouwing.

Stap 2 - Analyse per hoofdpunt:
Vergelijk de nota met het partijstandpunt. Zoek ook naar reacties van belangenorganisaties en uitvoerbaarheidsanalyses. Beschrijf per hoofdpunt de voorgestelde maatregel, de beoordeling vanuit het partijstandpunt (wat is goed, wat ontbreekt) en de verwachte impact.

Stap 3 - Beleidsalternatieven:
Analyseer vanuit het partijprogramma welke alternatieven er zijn. Beschrijf alternatieve maatregelen die beter passen bij de partijvisie - per alternatief: wat het inhoudt, waarom het beter is, en hoe het te realiseren is.`,
  },
  {
    soort: "Begrotingsoverleg",
    label: "Begrotingsoverleg",
    steps: ["Begrotingsanalyse", "Rekenkamer & CPB", "Begrotingsamendementen"],
    prompt: `Begrotingsoverleg - debat over de begroting van een specifiek ministerie, het draait om euro's.

Stap 1 - Begrotingsanalyse:
Zoek de begrotingsstukken op en lees ze. Vergelijk met de financiele prioriteiten van de partij. Geef een totaalbeeld van de begroting en beschrijf per opvallende post: naam, bedrag, verschuiving t.o.v. vorig jaar, en beoordeling.

Stap 2 - Rekenkamer & CPB:
Zoek rapporten van de Algemene Rekenkamer en CPB-doorrekeningen over dit beleidsterrein op. Beschrijf de relevante bevindingen: doelmatigheid, effectiviteit en risico's.

Stap 3 - Begrotingsamendementen:
Zoek op welke amendementen andere fracties al hebben ingediend. Formuleer daarnaast 1-2 eigen begrotingsamendementen. Geef per amendement aan welke post wordt gewijzigd, het bedrag erbij of eraf, de dekking (verschuiving binnen de begroting) en de toelichting.`,
  },
  {
    soort: "Rondetafelgesprek",
    label: "Rondetafelgesprek",
    steps: ["Achtergrond", "Profiel per genodigde", "Informatiebehoefte"],
    prompt: `Rondetafelgesprek - de commissie spreekt met experts en belanghebbenden. Er is geen minister aanwezig; dit is intelligence-gathering.

Stap 1 - Achtergrond:
Zoek op wat het onderwerp van het rondetafelgesprek is en waarom het is georganiseerd. Beschrijf het onderwerp, de aanleiding en welke beleidsvragen centraal staan.

Stap 2 - Profiel per genodigde:
Zoek per genodigde expert of organisatie op wat hun standpunten zijn, welke publicaties ze hebben gedaan en welke rapporten of adviezen ze hebben uitgebracht. Beschrijf per genodigde: naam en functie, achtergrond, bekende standpunten, en 2-3 gerichte vragen die relevante informatie opleveren voor de fractie.

Stap 3 - Informatiebehoefte:
Analyseer vanuit het partijstandpunt welke informatie de fractie nodig heeft op dit dossier. Beschrijf welke informatie uit dit gesprek moet komen voor toekomstige debatten en lever een geprioriteerde vragenlijst over alle genodigden heen.`,
  },
  {
    soort: "Procedurevergadering",
    label: "Procedurevergadering",
    steps: ["Agendaoverzicht", "Aanbevelingen per punt", "Suggesties eigen agendering"],
    prompt: `Procedurevergadering - hier wordt de commissieagenda bepaald. Strategisch belangrijk: de fractie kan invloed uitoefenen op wat er wel en niet besproken wordt.

Stap 1 - Agendaoverzicht:
Zoek de conceptagenda of besluitenlijst van deze procedurevergadering op en bekijk de achtergrond van de voorgestelde punten. Geef een overzicht van alle agendapunten met korte context per punt.

Stap 2 - Aanbevelingen per punt:
Vergelijk de agendapunten met de prioriteiten van de fractie en kijk naar actuele ontwikkelingen in het nieuws. Geef per agendapunt aan wat wordt voorgesteld en doe een aanbeveling (agenderen, niet agenderen, steunen, of rapporteur aanbieden) met onderbouwing.

Stap 3 - Suggesties eigen agendering:
Analyseer welke onderwerpen de fractie zelf op de agenda kan zetten. Beschrijf per suggestie het onderwerp en waarom het nu relevant is om dit te agenderen.`,
  },
  {
    soort: "Technische briefing",
    label: "Technische briefing",
    steps: ["Achtergrond", "Kernvragen", "Aandachtspunten fractie"],
    prompt: `Technische briefing - experts of ambtenaren informeren de commissie over een technisch onderwerp. Geen politiek debat, maar een kans om de materie te doorgronden.

Stap 1 - Achtergrond:
Zoek parlementaire documenten, rapporten en actueel nieuws op over het onderwerp. Beschrijf wat het onderwerp is, waarom het technisch complex is, wat de politieke relevantie is en welke organisatie de briefing geeft.

Stap 2 - Kernvragen:
Bekijk welke Kamervragen er eerder over dit onderwerp zijn gesteld en analyseer welke informatie nog ontbreekt. Formuleer 10-15 inhoudelijke vragen geordend per thema, gericht op het doorgronden van de materie.

Stap 3 - Aandachtspunten fractie:
Vergelijk het onderwerp met de relevante partijstandpunten. Beschrijf welke aspecten raken aan de partijpositie of lopende debatten en waar het Kamerlid extra op moet letten.`,
  },
  {
    soort: "Gesprek",
    label: "Gesprek",
    steps: ["Gesprekspartners", "Gespreksagenda", "Strategische vragen"],
    prompt: `Gesprek - informeel overleg met externe partijen of belanghebbenden. Goede voorbereiding is essentieel: weet met wie je praat, wat zij willen, en wat jij van hen nodig hebt.

Stap 1 - Gesprekspartners:
Zoek op wie de gesprekspartners zijn, bekijk hun website en recente publicaties, en zoek in parlementaire documenten en het nieuws naar hun eerdere standpunten. Beschrijf per genodigde: naam en functie, achtergrond, bekende standpunten, en wat hun belang is in dit gesprek.

Stap 2 - Gespreksagenda:
Zoek relevante beleidsontwikkelingen op en vergelijk met het partijstandpunt. Beschrijf de verwachte thema's en hoe ze raken aan de partijpositie.

Stap 3 - Strategische vragen:
Analyseer welke informatie politiek bruikbaar is. Formuleer 5-10 vragen geordend op prioriteit, gericht op het verkrijgen van informatie die de fractie kan inzetten in toekomstige debatten.`,
  },
  {
    soort: "Stemmingen",
    label: "Stemmingen",
    steps: ["Overzicht", "Stemadvies per item", "Gevoelige stemmingen"],
    prompt: `Stemmingen - de Kamer stemt over moties, amendementen en wetsvoorstellen.

Stap 1 - Overzicht:
Zoek op welke moties, amendementen en wetsvoorstellen in stemming komen en lees de teksten. Beschrijf hoeveel stemmingen er zijn, over welke thema's, en welke de belangrijkste zijn.

Stap 2 - Stemadvies per item:
Vergelijk elk item met het partijstandpunt en bekijk de context van het debat waarin het is ingediend. Geef per motie, amendement of wetsvoorstel: nummer en indiener, strekking (1-2 zinnen), stemadvies (voor/tegen/onthouden) en onderbouwing vanuit het partijstandpunt.

Stap 3 - Gevoelige stemmingen:
Bekijk of er media-aandacht is voor specifieke stemmingen. Beschrijf stemmingen die politiek risico dragen, mediagevoelig zijn of onverwachte bondgenoten opleveren. Geef per gevoelige stemming aan wat het risico is en hoe te handelen.`,
  },
  {
    soort: "Regeling van werkzaamheden",
    label: "Regeling van werkzaamheden",
    steps: ["Overzicht", "Lopende debataanvragen", "Mogelijke eigen aanvragen"],
    prompt: `Regeling van werkzaamheden - kort plenair overleg voor debataanvragen en procedurele verzoeken.

Stap 1 - Overzicht:
Zoek de huidige plenaire planning en recente debataanvragen op. Beschrijf wat er op de agenda staat en welke kansen er liggen.

Stap 2 - Lopende debataanvragen:
Zoek op welke debatten er recent zijn aangevraagd door alle fracties. Beschrijf per aanvraag: aanvrager, onderwerp en status (wel/niet gesteund, wel/niet ingepland).

Stap 3 - Mogelijke eigen aanvragen:
Bekijk het nieuws voor urgente onderwerpen, vergelijk met de thema's van de fractie en zoek recente Kamerbrieven die als aanleiding kunnen dienen. Beschrijf per suggestie: het onderwerp, de aanleiding, waarom dit nu een debat verdient, en welke fracties het waarschijnlijk steunen.`,
  },
  {
    soort: "Werkbezoek",
    label: "Werkbezoek",
    steps: ["Organisatie-achtergrond", "Beleidsontwikkelingen", "Vragenlijst", "Mediakansen"],
    prompt: `Werkbezoek - Kamerleden bezoeken een organisatie of instelling om ervaringen uit de praktijk op te halen.

Stap 1 - Organisatie-achtergrond:
Bekijk de website van de organisatie en zoek in parlementaire documenten naar gerelateerde Kamervragen en debatten. Beschrijf wat de organisatie doet, hoeveel mensen er werken, hoe het wordt gefinancierd en wat de relatie is tot het rijksbeleid.

Stap 2 - Beleidsontwikkelingen:
Zoek relevante beleidswijzigingen en recent nieuws over deze organisatie of sector op. Beschrijf recente wetswijzigingen, bezuinigingen, investeringen of beleidswijzigingen die deze organisatie raken.

Stap 3 - Vragenlijst:
Vergelijk met het partijstandpunt op dit beleidsterrein. Formuleer 10-15 vragen voor gesprekken ter plaatse, gericht op het ophalen van ervaringen uit de praktijk die bruikbaar zijn in Kamerdebatten.

Stap 4 - Mediakansen:
Analyseer welke bevindingen mediageniek kunnen zijn. Beschrijf mogelijke fotomomenten, quotes of bevindingen die de fractie kan inzetten voor communicatie en sociale media.`,
  },
  {
    soort: "Petitieaanbieding",
    label: "Petitieaanbieding",
    steps: ["Achtergrond petitie", "Profiel indiener", "Beleidscontext", "Vragen & aandachtspunten"],
    prompt: `Petitieaanbieding - burgers of organisaties bieden een petitie aan bij de Kamer. Het Kamerlid ontvangt de petitie namens de commissie en moet weten wie er voor hem staat en wat ze willen.

Stap 1 - Achtergrond petitie:
Zoek op wat de petitie inhoudt: wat wordt er gevraagd, hoeveel mensen hebben getekend, en wat is de directe aanleiding. Beschrijf de kern van het verzoek, de omvang van het draagvlak en de context waarin de petitie is gestart.

Stap 2 - Profiel indiener:
Zoek op wie de petitie heeft ingediend. Bekijk de website van de organisatie of het initiatief, zoek in het nieuws en in parlementaire documenten naar eerdere betrokkenheid. Beschrijf wat de organisatie doet, wie erachter zitten, hoe groot ze zijn, hoe ze worden gefinancierd, en of ze eerder petities of lobbycampagnes hebben gevoerd.

Stap 3 - Beleidscontext:
Zoek relevante Kamerbrieven, wetsvoorstellen en eerdere debatten op over het onderwerp van de petitie. Vergelijk met het partijstandpunt. Beschrijf de huidige stand van het beleid, wat de regering al doet of van plan is, en hoe het partijstandpunt zich verhoudt tot het verzoek in de petitie.

Stap 4 - Vragen & aandachtspunten:
Formuleer 5-10 vragen die het Kamerlid kan stellen bij de ontvangst of kan meenemen naar een volgend debat. Beschrijf ook eventuele risico's of gevoeligheden (mediadruk, achterban, politieke valkuilen).`,
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
