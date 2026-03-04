import { generateText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
} from "@/lib/tools"
import { NextResponse } from "next/server"

export const maxDuration = 120

export async function POST(req: Request) {
  const { topic, partyId, partyName, organisationId } = await req.json()

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const prompt = `Genereer een uitgebreide debriefing over het onderwerp: "${topic}"

Structuur:
## Samenvatting
Korte samenvatting van het onderwerp en de huidige stand van zaken.

## Parlementaire Geschiedenis
Tijdlijn van relevante Kamerstukken, moties en amendementen.

## Standpunten per Fractie
Overzicht van posities van de verschillende fracties op basis van stemmingen en uitspraken.

## Openstaande Toezeggingen
Toezeggingen van ministers die nog niet zijn nagekomen.

## Suggestievragen voor het Debat
Concrete vragen om aan de minister te stellen, met verwijzing naar bronnen.

${partyName ? `Frame alles vanuit het perspectief van ${partyName}.` : "Geef een neutraal, gebalanceerd overzicht."}

Gebruik je tools om actuele informatie op te zoeken. Verwijs altijd naar bronnen.`

  const { text } = await generateText({
    model: getModel(),
    system: `Je bent een parlementair onderzoeksassistent die debatbriefings schrijft voor Kamerleden. Gebruik altijd je tools om informatie op te zoeken. Schrijf in het Nederlands. Verwijs naar specifieke Kamerstuknummers.`,
    prompt,
    stopWhen: stepCountIs(15),
    tools: {
      searchKamerstukken,
      searchHandelingen,
      searchToezeggingen,
      searchStemmingen,
      searchNews,
      searchPartyDocs: createSearchPartyDocs(
        partyId ?? null,
        organisationId ?? null
      ),
    },
  })

  return NextResponse.json({ topic, content: text })
}
