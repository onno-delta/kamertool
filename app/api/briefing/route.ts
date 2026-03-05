import { generateText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { briefings } from "@/lib/db/schema"
import { getActiveKey } from "@/lib/user-keys"
import { checkAndIncrementUsage } from "@/lib/rate-limit"
import { cookies } from "next/headers"
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
  try {
    const { topic, partyId, partyName, organisationId } = await req.json()
    console.log("[briefing] POST", { topic, partyId, partyName })

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null
    console.log("[briefing] auth", { userId })

    let modelOpts: { model?: string; apiKey?: string } | undefined
    let usingOwnKey = false

    if (userId) {
      const userKey = await getActiveKey(userId)
      if (userKey) {
        modelOpts = { model: userKey.model, apiKey: userKey.apiKey }
        usingOwnKey = true
      }
    }

    if (!usingOwnKey) {
      const cookieStore = await cookies()
      const sessionId = cookieStore.get("session-id")?.value ?? null
      const { allowed, used, limit } = await checkAndIncrementUsage(userId, sessionId)
      console.log("[briefing] rate limit", { allowed, used, limit })
      if (!allowed) {
        return NextResponse.json(
          {
            error: "rate_limit",
            message: `Dagelijkse limiet bereikt (${limit} berichten).`,
            used,
            limit,
          },
          { status: 429 }
        )
      }
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

    console.log("[briefing] generating text...")
    const { text } = await generateText({
      model: getModel(modelOpts),
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
    console.log("[briefing] done, length:", text.length)

    // Save briefing to database
    if (userId) {
      await db.insert(briefings).values({
        userId,
        organisationId: organisationId ?? null,
        topic,
        content: text,
      })
      console.log("[briefing] saved to db")
    }

    return NextResponse.json({ topic, content: text })
  } catch (error) {
    console.error("[briefing] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
