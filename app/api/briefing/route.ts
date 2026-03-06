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
  searchOpenTK,
  getOpenTKDocument,
  getRecenteKamervragen,
} from "@/lib/tools"
import { NextResponse } from "next/server"
import { getDefaultSkill } from "@/lib/meeting-skills"

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { topic, partyId, partyName, organisationId, kamerleden, soort, meetingSkill } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    let modelOpts: { model?: string; apiKey?: string } | undefined
    let usingOwnKey = false

    if (userId) {
      const userKey = await getActiveKey(userId)
      if (userKey) {
        modelOpts = { model: userKey.model, apiKey: userKey.apiKey }
        usingOwnKey = true
      }
    }

    let setSessionCookie: string | null = null
    if (!usingOwnKey && !isUnlimitedEmail(session?.user?.email)) {
      const cookieStore = await cookies()
      let sessionId = cookieStore.get("session-id")?.value ?? null
      if (!sessionId && !userId) {
        sessionId = crypto.randomUUID()
        setSessionCookie = sessionId
      }
      const { allowed, used, limit } = await checkAndIncrementUsage(userId, sessionId)
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

    // Resolve the meeting skill: user override > default for this soort > empty
    const skillPrompt = meetingSkill || (soort ? getDefaultSkill(soort) : "")

    const prompt = `Genereer een uitgebreide debriefing over het onderwerp: "${topic}"${soort ? ` (type vergadering: ${soort})` : ""}

Aanpak:
1. Zoek eerst via searchOpenTK (full-text search over alle parlementaire documenten) naar relevante stukken.
2. Haal voor de belangrijkste documenten de volledige tekst op via getOpenTKDocument en vat samen wat erin staat.
3. Zoek aanvullend via searchKamerstukken en searchDocumenten voor gestructureerde resultaten.
4. Zoek toezeggingen, stemmingen, handelingen en nieuws.

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

## Mogelijke Speech
Schrijf een concept-speech voor gebruik in het debat.
${Array.isArray(kamerleden) && kamerleden.length > 0 ? `Zoek eerst via searchOpenTK naar eerdere speeches en bijdragen van ${kamerleden[0]} in de Handelingen. Analyseer hun spreekstijl: toon, woordgebruik, lengte van zinnen, retorische patronen, hoe ze ministers aanspreken. Schrijf de concept-speech in diezelfde stijl.` : "Schrijf een zakelijke, neutrale speech die past bij een Kamerdebat."}
De speech moet verwijzen naar concrete documenten en feiten uit de briefing hierboven.
${skillPrompt ? `\n--- SPECIFIEKE INSTRUCTIES VOOR DIT TYPE VERGADERING (${soort}) ---\n${skillPrompt}\n--- EINDE SPECIFIEKE INSTRUCTIES ---` : ""}
${partyName ? `\nFrame alles vanuit het perspectief van ${partyName}.` : "\nGeef een neutraal, gebalanceerd overzicht."}
${Array.isArray(kamerleden) && kamerleden.length > 0 ? `\nRelevante Kamerleden om specifiek aandacht aan te besteden: ${kamerleden.join(", ")}. Zoek hun standpunten, uitspraken en ingediende moties op over dit onderwerp. Vermeld hun positie in de sectie Standpunten per Fractie en betrek hun specifieke bijdragen in de suggestievragen.` : ""}

BELANGRIJK: Zoek de daadwerkelijke inhoud van de relevante stukken op en vat samen wat erin staat. Noem altijd het documentnummer en de datum. Gebruik je tools om actuele informatie op te zoeken.`

    const result = streamText({
      model: getModel(modelOpts),
      system: `Je bent een parlementair onderzoeksassistent die debatbriefings schrijft voor Kamerleden. Gebruik altijd je tools om informatie op te zoeken. Schrijf in het Nederlands. Verwijs naar specifieke documentnummers en Kamerstuknummers.

Werkwijze:
- Gebruik searchOpenTK als primaire zoekmachine — dit doorzoekt alle parlementaire documenten via full-text search (opentk.nl)
- Gebruik getOpenTKDocument om de volledige tekst van gevonden documenten op te halen via hun documentnummer
- Gebruik searchDocumenten en searchKamerstukken voor aanvullende gestructureerde zoekopdrachten via de TK API
- Gebruik searchToezeggingen, searchStemmingen en searchHandelingen voor context
- Gebruik getRecenteKamervragen om recente schriftelijke vragen te bekijken
- Vat de inhoud van elk relevant stuk bondig maar volledig samen
- Voor de concept-speech: zoek altijd eerst eerdere bijdragen van het Kamerlid op in de Handelingen via searchOpenTK om hun spreekstijl te analyseren en te imiteren`,
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
        searchOpenTK,
        getOpenTKDocument,
        getRecenteKamervragen,
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

          // Save to DB
          if (userId && fullText) {
            await db.insert(briefings).values({
              userId,
              organisationId: organisationId ?? null,
              topic,
              content: fullText,
            })
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

    const headers: Record<string, string> = {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    }
    if (setSessionCookie) {
      headers["Set-Cookie"] = `session-id=${setSessionCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
    }
    return new Response(stream, { headers })
  } catch (error) {
    console.error("[briefing] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
