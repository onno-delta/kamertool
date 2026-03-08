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
    prompt: `Dit is een plenair debat — het meest zichtbare format in de Tweede Kamer, met veel media-aandacht.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek de aanleiding: welke brief, nota of gebeurtenis heeft tot dit debat geleid?
- Breng de politieke verhoudingen in kaart: welke fracties staan tegenover elkaar?
- Bereid interruptiestrategie voor: welke zwakke punten in het kabinetsbeleid kun je aanvallen?
- Formuleer 2-3 scherpe moties met concrete verzoeken of uitspraken.

Extra secties voor dit type debat:

Interruptiestrategie:
Identificeer de belangrijkste stellingen van de minister en andere fracties. Geef per stelling een mogelijke interruptie met bronverwijzing.

Conceptmoties:
Schrijf 2-3 conceptmoties (dictum-formaat: "verzoekt de regering..." of "spreekt uit dat...") die aansluiten bij de partijpositie.

De concept-speech moet 3-5 minuten zijn (600-800 woorden) en retorisch sterk, geschikt voor de plenaire zaal.`,
  },
  {
    soort: "Commissiedebat",
    label: "Commissiedebat",
    prompt: `Dit is een commissiedebat — technisch, inhoudelijk en met meer ruimte voor detail dan een plenair debat.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Analyseer alle relevante Kamerbrieven en beleidsnota's die op de agenda staan.
- Zoek specifieke data, cijfers en beleidsresultaten die de minister kan worden voorgehouden.
- Identificeer openstaande toezeggingen die nog niet zijn nagekomen.
- Vergelijk het beleid met het verkiezingsprogramma en eerdere standpunten.

Extra secties voor dit type debat:

Technische analyse:
Per agendapunt: samenvatting van het beleidsdocument, kritische kanttekeningen, en concrete vragen.

Openstaande punten:
Overzicht van eerdere toezeggingen, Kamervragen en moties die nog niet zijn afgehandeld.

De concept-speech moet 4-6 minuten zijn (700-1000 woorden) en inhoudelijk sterk, met verwijzingen naar specifieke documenten en cijfers.`,
  },
  {
    soort: "Wetgevingsoverleg",
    label: "Wetgevingsoverleg",
    prompt: `Dit is een wetgevingsoverleg — gericht op een specifiek wetsvoorstel dat artikel voor artikel wordt besproken.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek het wetsvoorstel, de memorie van toelichting en het advies van de Raad van State op.
- Analyseer de belangrijkste artikelen en identificeer problematische bepalingen.
- Zoek amendementen die al zijn ingediend door andere fracties.
- Vergelijk met bestaande wetgeving en mogelijke juridische conflicten.

Extra secties voor dit type debat:

Wetsanalyse:
Per relevant artikel: wat regelt het, wat zijn de gevolgen, en welke bezwaren zijn er.

Amendementen:
Stel 1-3 conceptamendementen voor op specifieke artikelen, met toelichting waarom de wijziging nodig is.

Juridische kanttekeningen:
Mogelijke conflicten met Grondwet, EU-recht of bestaande wetgeving.

De concept-speech moet gericht zijn op de hoofdlijnen van het wetsvoorstel (3-4 minuten, 500-700 woorden) en juridisch onderbouwd.`,
  },
  {
    soort: "Tweeminutendebat",
    label: "Tweeminutendebat",
    prompt: `Dit is een tweeminutendebat — extreem kort (max 2 minuten), bedoeld om moties in te dienen na een eerder commissiedebat.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek het voorafgaande commissiedebat op en analyseer welke punten onopgelost bleven.
- Identificeer 1-2 concrete punten waar een motie verschil kan maken.
- Formuleer maximaal 2 scherpe moties.
- Zoek steun bij andere fracties: welke partijen delen dit standpunt?

Extra secties voor dit type debat:

Terugblik commissiedebat:
Wat was de uitkomst van het eerdere debat? Welke toezeggingen zijn gedaan? Wat bleef open?

Conceptmoties:
Schrijf 1-2 moties in dictum-formaat. Houd ze concreet en haalbaar voor een Kamermeerderheid.

De concept-speech moet MAXIMAAL 2 minuten zijn (250-300 woorden). Elke zin telt. Geen inleiding, direct to the point. Structuur: 1-2 zinnen context, kernpunt, aankondiging motie(s).`,
  },
  {
    soort: "Notaoverleg",
    label: "Notaoverleg",
    prompt: `Dit is een notaoverleg — een debat over een specifieke beleidsnota of beleidsbrief van de minister.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek de nota/beleidsbrief op die centraal staat en vat de hoofdpunten samen.
- Vergelijk de voorgestelde maatregelen met het partijprogramma.
- Zoek naar uitvoerbaarheidsanalyses, adviezen van de Raad van State, en reacties van belangenorganisaties.
- Identificeer wat er ontbreekt in de nota.

Extra secties voor dit type debat:

Nota-analyse:
Samenvatting van de nota met per hoofdpunt: wat staat er, wat is de impact, en wat ontbreekt.

Beleidsalternatieven:
Welke alternatieve maatregelen passen beter bij de partijvisie?

De concept-speech moet 3-5 minuten zijn (500-800 woorden) en beleidsinhoudelijk, met concrete alternatieven.`,
  },
  {
    soort: "Begrotingsoverleg",
    label: "Begrotingsoverleg",
    prompt: `Dit is een begrotingsoverleg — gericht op de begroting van een specifiek ministerie.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek de begrotingsstukken op en analyseer de belangrijkste posten en verschuivingen.
- Vergelijk met voorgaande jaren: waar wordt meer/minder uitgegeven?
- Zoek dekkingsvoorstellen en doorrekeningen (CPB, Rekenkamer).
- Identificeer posten waar amendementen kansrijk zijn.

Extra secties voor dit type debat:

Begrotingsanalyse:
Top 5 opvallende begrotingsposten met bedragen, verschuivingen t.o.v. vorig jaar, en beoordeling.

Financiele amendementen:
Stel 1-2 begrotingsamendementen voor met dekking (verschuiving binnen de begroting).

Rekenkamer en CPB:
Relevante bevindingen van de Algemene Rekenkamer en het CPB over dit beleidsterrein.

De concept-speech moet 4-6 minuten zijn (700-1000 woorden) en financieel onderbouwd, met concrete bedragen en vergelijkingen.`,
  },
  {
    soort: "Rondetafelgesprek",
    label: "Rondetafelgesprek",
    prompt: `Dit is een rondetafelgesprek — een informatief gesprek met experts en belanghebbenden, geen debat met de minister.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek op welke experts en organisaties zijn uitgenodigd (via de agendastukken).
- Bereid gerichte vragen voor per genodigde, gebaseerd op hun expertise en eerdere publicaties.
- Identificeer welke informatie je nodig hebt voor toekomstige debatten over dit onderwerp.
- Zoek achtergrondstukken en position papers van de genodigde organisaties.

Extra secties voor dit type vergadering:

Vragen per genodigde:
Per expert/organisatie: wie zijn ze, wat is hun positie, en 2-3 gerichte vragen.

Informatiebehoefte:
Welke informatie moet uit dit gesprek komen om het partijstandpunt te onderbouwen in toekomstige debatten?

Er is GEEN concept-speech nodig voor een rondetafelgesprek. Schrijf in plaats daarvan een overzicht van de belangrijkste vragen, geordend op prioriteit.`,
  },
  {
    soort: "Procedurevergadering",
    label: "Procedurevergadering",
    prompt: `Dit is een procedurevergadering — hier wordt de agenda van de commissie bepaald: welke debatten worden ingepland, welke brieven worden geagendeerd, welke rapporteurs worden benoemd.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek de conceptagenda/besluitenlijst van deze procedurevergadering op.
- Identificeer welke onderwerpen worden voorgesteld voor agendering en welke politiek relevant zijn.
- Zoek achtergrond bij de Kamerbrieven en stukken die op de agenda staan.
- Inventariseer welke onderwerpen de partij zou willen agenderen of juist tegenhouden.

Extra secties voor dit type vergadering:

Agendaoverzicht:
Per agendapunt: wat wordt voorgesteld (debat aanvragen, brief naar Kamer, rapporteur benoemen) en wat is de relevantie.

Aandachtspunten:
Welke punten verdienen extra aandacht? Waar kan de fractie invloed uitoefenen op de commissieagenda?

Suggesties voor agendering:
Onderwerpen die de fractie zelf zou kunnen voorstellen voor een debat of overleg.

Er is GEEN concept-speech nodig voor een procedurevergadering. Geef in plaats daarvan een beknopt overzicht van de strategische keuzes per agendapunt.`,
  },
  {
    soort: "Technische briefing",
    label: "Technische briefing",
    prompt: `Dit is een technische briefing — ambtenaren of externe experts informeren de commissie over een technisch of complex onderwerp, zonder politiek debat.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek op welk onderwerp de briefing gaat en welke organisatie of experts presenteren.
- Zoek achtergrondstukken, rapporten en eerdere Kamervragen over dit onderwerp.
- Bereid inhoudelijke vragen voor die helpen om de materie te doorgronden.
- Identificeer welke informatie nodig is voor latere politieke debatten.

Extra secties voor dit type vergadering:

Achtergrond:
Samenvatting van het onderwerp, waarom het technisch complex is, en wat de politieke relevantie is.

Kernvragen:
10-15 inhoudelijke vragen geordend op thema, gericht op het begrijpen van de materie (niet politiek maar technisch).

Aandachtspunten voor de fractie:
Welke aspecten van dit onderwerp raken aan de partijstandpunten of lopende debatten?

Er is GEEN concept-speech nodig. Lever een gestructureerde vragenlijst op.`,
  },
  {
    soort: "Gesprek",
    label: "Gesprek",
    prompt: `Dit is een gesprek — een informeel overleg van de commissie met externe partijen, belanghebbenden of bewindspersonen in een minder formele setting.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek op met wie het gesprek plaatsvindt en over welk onderwerp.
- Analyseer de positie en achtergrond van de gesprekspartner(s).
- Zoek eerdere standpunten en publicaties van de genodigden.
- Bereid gerichte vragen voor die aansluiten bij de fractieprioriteiten.

Extra secties voor dit type vergadering:

Gesprekspartners:
Per genodigde: achtergrond, functie, bekende standpunten en relevante publicaties.

Gespreksagenda:
Verwachte thema's en hoe ze raken aan het partijstandpunt.

Vragenlijst:
5-10 strategische vragen, geordend op prioriteit.

Er is GEEN concept-speech nodig. Geef een beknopte gespreksvoorbereiding met focus op de juiste vragen.`,
  },
  {
    soort: "Stemmingen",
    label: "Stemmingen",
    prompt: `Dit zijn stemmingen — de Kamer stemt over moties, amendementen en wetsvoorstellen.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek op welke moties, amendementen en wetsvoorstellen in stemming worden gebracht.
- Analyseer per motie/amendement: wie heeft het ingediend, wat is de strekking, en hoe verhoudt het zich tot het partijstandpunt.
- Zoek of er al stemadviezen zijn uitgebracht door de fractie of coalitie/oppositie.
- Identificeer moties die politiek gevoelig zijn of media-aandacht kunnen trekken.

Extra secties voor dit type vergadering:

Stemoverzicht:
Per motie/amendement: nummer, indiener, strekking, en aanbevolen stemgedrag vanuit het partijperspectief (voor/tegen/onthouden) met onderbouwing.

Gevoelige stemmingen:
Moties of amendementen waarbij het stemgedrag politiek risico draagt of mediagevoelig is.

Er is GEEN concept-speech nodig. Geef een helder stemadviesoverzicht.`,
  },
  {
    soort: "Regeling van werkzaamheden",
    label: "Regeling van werkzaamheden",
    prompt: `Dit is een regeling van werkzaamheden — het korte plenaire overleg waarin debatten worden aangevraagd, de agenda wordt vastgesteld, en fracties procedurele verzoeken doen.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek welke debatten recent zijn aangevraagd en welke op de rol staan.
- Inventariseer actuele onderwerpen waarover de fractie een debat zou willen aanvragen.
- Zoek of er spoeddebatten of dertigledendebatten zijn aangevraagd door andere fracties.

Extra secties voor dit type vergadering:

Lopende debataanvragen:
Overzicht van aangevraagde debatten die nog niet zijn ingepland, met aanvrager en onderwerp.

Mogelijke debataanvragen:
Actuele onderwerpen waar de fractie een debat over zou kunnen aanvragen, met onderbouwing.

Er is GEEN concept-speech nodig. Geef een compact overzicht van strategische mogelijkheden.`,
  },
  {
    soort: "Werkbezoek",
    label: "Werkbezoek",
    prompt: `Dit is een werkbezoek — Kamerleden bezoeken een locatie, organisatie of instelling om zich ter plekke te laten informeren.

Context: neem de geselecteerde partij, Kamerleden, dossiers en eigen bronnen mee. Frame de analyse vanuit het partijperspectief, zoek standpunten en bijdragen van de geselecteerde Kamerleden op, raadpleeg de eigen bronnen van de gebruiker, en focus op de relevante beleidsdossiers.

Aanpak:
- Zoek op welke organisatie of locatie wordt bezocht en waarom.
- Analyseer de achtergrond van de te bezoeken organisatie: wat doen ze, wat is hun rol in het beleidsveld, zijn er recente ontwikkelingen?
- Zoek eerdere Kamervragen, debatten of rapporten over deze organisatie of het gerelateerde beleidsterrein.
- Zoek nieuwsberichten over de organisatie of locatie.

Extra secties voor dit type vergadering:

Achtergrond bezochte organisatie:
Wat doet de organisatie, hoeveel mensen werken er, wat is hun financiering, en wat is hun relatie tot het rijksbeleid?

Relevante beleidsontwikkelingen:
Recente wetswijzigingen, bezuinigingen, investeringen of beleidswijzigingen die deze organisatie raken.

Vragenlijst voor het bezoek:
10-15 vragen voor gesprekken ter plaatse, gericht op het ophalen van ervaringen uit de praktijk die bruikbaar zijn in Kamerdebatten.

Mediakansen:
Zijn er fotomomenten, quotes of bevindingen die de fractie kan gebruiken in communicatie?

Er is GEEN concept-speech nodig. Geef een compacte voorbereidingsnotitie met achtergrond en vragen.`,
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
