/**
 * Preview script: generates a sample briefing PDF with lorem ipsum content.
 * Run: npx tsx scripts/preview-pdf.tsx
 * Output: /tmp/briefing-preview.pdf
 */
import { writeFileSync } from "fs"
import { renderToBuffer } from "@react-pdf/renderer"
import { BriefingPDF } from "../lib/pdf-template"
import React from "react"

const SAMPLE_CONTENT = `# Samenvatting

Dit is een **debatbriefing** over het begrotingsdebat 2026. De belangrijkste punten zijn hieronder samengevat. Het kabinet heeft diverse maatregelen aangekondigd die directe gevolgen hebben voor de *koopkracht* van huishoudens.

## Achtergrond en context

Het begrotingsdebat vindt plaats in een periode van economische onzekerheid. De inflatie is gedaald naar 2,3%, maar de koopkracht blijft onder druk staan. Het CPB raamt een economische groei van 1,8% voor 2026, wat lager is dan eerder verwacht.

De Europese Commissie heeft Nederland gewaarschuwd voor het oplopende begrotingstekort. Het kabinet moet balanceren tussen investeringen in publieke voorzieningen en begrotingsdiscipline.

### Macro-economische indicatoren

- **BBP-groei:** 1,8% (raming CPB)
- **Inflatie:** 2,3% (dalend)
- **Werkloosheid:** 3,9% (stabiel)
- **Begrotingstekort:** -2,1% BBP

### Koopkrachtplaatje

Het koopkrachtplaatje laat een gemengd beeld zien. Werkenden gaan er gemiddeld 0,5% op vooruit, terwijl gepensioneerden er 0,3% op achteruitgaan. Alleenstaande ouders met kinderen profiteren het meest van de voorgestelde maatregelen.

## Standpunten fracties

### Coalitie

De coalitiepartijen steunen het begrotingsvoorstel, maar hebben onderling meningsverschillen over de verdeling van middelen. Met name de besteding aan defensie en ontwikkelingssamenwerking is een punt van discussie.

1. **VVD** pleit voor lastenverlichting voor het bedrijfsleven
2. **NSC** benadrukt de noodzaak van investeringen in onderwijs
3. **BBB** wil meer geld voor landbouw en platteland
4. **PVV** focust op koopkracht en migratie

### Oppositie

De oppositie is kritisch over de bezuinigingen op zorg en onderwijs. Diverse partijen hebben alternatieve begrotingsplannen ingediend.

- *GroenLinks-PvdA* wil meer investeren in klimaat en sociale zekerheid
- *D66* pleit voor hogere uitgaven aan innovatie en onderwijs
- *SP* is tegen elke vorm van bezuiniging op publieke voorzieningen
- *CDA* zoekt een middenweg met focus op gezinsbeleid

---

## Relevante kamerstukken

De volgende documenten zijn relevant voor dit debat:

1. Miljoenennota 2026 (Kamerstuk 36600-1)
2. Macro Economische Verkenning 2026 (CPB)
3. Voorjaarsnota 2025 (Kamerstuk 36500-1)
4. Advies Raad van State over de rijksbegroting

#### Moties en amendementen

Er zijn tot nu toe 47 moties en 12 amendementen ingediend. De belangrijkste gaan over:

- Verhoging van het minimumloon met 2%
- Extra investeringen in de energietransitie
- Aanpassing van de vermogensrendementsheffing
- Compensatie voor gedupeerden van de toeslagenaffaire

## Aanbevelingen voor het debat

**Kernboodschap:** Focus op de koopkrachteffecten voor middeninkomens en de lange-termijn gevolgen van de voorgestelde bezuinigingen.

**Mogelijke interrupties:**
- Vraag naar de doorrekening van alternatieve begrotingsplannen
- Verwijs naar de waarschuwing van de Europese Commissie
- Confronteer de minister met eerdere beloftes over koopkracht

---

*Deze briefing is gegenereerd op basis van openbare bronnen waaronder parlementaire documenten, nieuwsberichten en CPB-publicaties.*
`

async function main() {
  const element = React.createElement(BriefingPDF, {
    topic: "Begrotingsdebat 2026",
    content: SAMPLE_CONTENT,
    date: "6 maart 2026",
    partyName: "VVD",
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)
  writeFileSync("/tmp/briefing-preview.pdf", buffer)
  console.log("Preview PDF saved to /tmp/briefing-preview.pdf")
}

main().catch(console.error)
