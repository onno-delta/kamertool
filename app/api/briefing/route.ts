import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { briefings } from "@/lib/db/schema"
import { getActiveKey } from "@/lib/user-keys"
import { checkAndIncrementUsage, isUnlimitedEmail } from "@/lib/rate-limit"
import { cookies } from "next/headers"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
  fetchWebPage,
  searchAgenda,
  searchDocumenten,
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

    if (!usingOwnKey && !isUnlimitedEmail(session?.user?.email)) {
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

Aanpak:
1. Zoek eerst relevante Kamerstukken (searchKamerstukken) en documenten (searchDocumenten) — met name Kamerbrieven, nota's en verslagen.
2. Haal voor de belangrijkste documenten de inhoud op via fetchWebPage (gebruik de URL uit searchDocumenten) en vat samen wat erin staat.
3. Zoek toezeggingen, stemmingen, handelingen en nieuws.

Structuur:
## Samenvatting
Korte samenvatting van het onderwerp en de huidige stand van zaken.

## Relevante Stukken naar de Kamer
Per relevant document (Kamerbrief, nota, verslag):
- **Documentnummer** en titel
- **Datum** waarop het naar de Kamer is gestuurd
- **Samenvatting** van de inhoud: wat staat erin, wat zijn de hoofdpunten, welke maatregelen of standpunten worden beschreven

## Moties en Amendementen
Overzicht van ingediende en aangenomen moties en amendementen, met indieners en strekking.

## Openstaande Toezeggingen
Toezeggingen van ministers die nog niet zijn nagekomen.

## Standpunten per Fractie
Overzicht van posities van de verschillende fracties op basis van stemmingen en uitspraken.

## Suggestievragen voor het Debat
Concrete vragen om aan de minister te stellen, met verwijzing naar specifieke documenten en bronnen.

${partyName ? `Frame alles vanuit het perspectief van ${partyName}.` : "Geef een neutraal, gebalanceerd overzicht."}

BELANGRIJK: Zoek de daadwerkelijke inhoud van de relevante stukken op en vat samen wat erin staat. Noem altijd het documentnummer en de datum. Gebruik je tools om actuele informatie op te zoeken.`

    console.log("[briefing] starting stream...")
    const result = streamText({
      model: getModel(modelOpts),
      system: `Je bent een parlementair onderzoeksassistent die debatbriefings schrijft voor Kamerleden. Gebruik altijd je tools om informatie op te zoeken. Schrijf in het Nederlands. Verwijs naar specifieke documentnummers en Kamerstuknummers.

Werkwijze:
- Gebruik searchDocumenten om relevante Kamerbrieven, nota's en verslagen te vinden
- Gebruik fetchWebPage om de inhoud van gevonden documenten op te halen en samen te vatten
- Gebruik searchKamerstukken voor moties, amendementen en wetsvoorstellen
- Gebruik searchToezeggingen, searchStemmingen en searchHandelingen voor context
- Vat de inhoud van elk relevant stuk bondig maar volledig samen`,
      prompt,
      stopWhen: stepCountIs(25),
      tools: {
        searchKamerstukken,
        searchHandelingen,
        searchToezeggingen,
        searchStemmingen,
        searchNews,
        fetchWebPage,
        searchAgenda,
        searchDocumenten,
        searchPartyDocs: createSearchPartyDocs(
          partyId ?? null,
          organisationId ?? null
        ),
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = ""

          for await (const part of result.fullStream) {
            if (part.type === "tool-call") {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool-start",
                    id: part.toolCallId,
                    tool: part.toolName,
                    args: part.input,
                  }) + "\n"
                )
              )
            } else if (part.type === "tool-result") {
              const output = part.output as Record<string, unknown> | undefined
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool-done",
                    id: part.toolCallId,
                    tool: part.toolName,
                    count:
                      (output?.count as number) ??
                      (output?.results as unknown[] | undefined)?.length ??
                      0,
                  }) + "\n"
                )
              )
            } else if (part.type === "text-delta") {
              fullText += part.text
            }
          }

          console.log("[briefing] stream done, length:", fullText.length)

          // Save to DB
          if (userId && fullText) {
            await db.insert(briefings).values({
              userId,
              organisationId: organisationId ?? null,
              topic,
              content: fullText,
            })
            console.log("[briefing] saved to db")
          }

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "done", content: fullText }) + "\n"
            )
          )
          controller.close()
        } catch (err) {
          console.error("[briefing] stream error:", err)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: String(
                  err instanceof Error ? err.message : err
                ),
              }) + "\n"
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[briefing] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
