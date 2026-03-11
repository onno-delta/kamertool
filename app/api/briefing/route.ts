import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { briefings, users, userSources } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
  searchParlement,
  getDocumentText,
  getRecenteKamervragen,
  searchOpenTK,
  getOpenTKDocument,
  searchExa,
} from "@/lib/tools"
import { NextResponse } from "next/server"
import { assembleSkillPrompt } from "@/lib/meeting-skills"
import { briefingBodySchema } from "@/lib/validation"
import { safeErrorResponse } from "@/lib/errors"

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = briefingBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { topic, partyId, partyName, organisationId, kamerleden, soort, meetingSkill } = parsed.data

    const session = await auth()
    const userId = session?.user?.id ?? null

    let setSessionCookie: string | null = null
    if (!isUnlimitedEmail(session?.user?.email)) {
      const cookieStore = await cookies()
      let sessionId = cookieStore.get("session-id")?.value ?? null
      if (!sessionId && !userId) {
        sessionId = crypto.randomUUID()
        setSessionCookie = sessionId
      }
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
      const { allowed, used, limit } = await checkAndIncrementUsage(userId, sessionId, ip)
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

    // Resolve the meeting skill: base layer (always default) + user layer (override or default)
    // meetingSkill from the client is the user's custom text (user layer only)
    const skillPrompt = soort ? assembleSkillPrompt(soort, meetingSkill || undefined) : ""

    const hasKamerleden = Array.isArray(kamerleden) && kamerleden.length > 0

    // Fetch user's priority sources + search-beyond preference
    const sources = userId
      ? await db.select({ url: userSources.url, title: userSources.title }).from(userSources).where(eq(userSources.userId, userId))
      : []
    let searchBeyondSources = true
    if (userId) {
      const [user] = await db.select({ searchBeyondSources: users.searchBeyondSources }).from(users).where(eq(users.id, userId)).limit(1)
      if (user) searchBeyondSources = user.searchBeyondSources
    }

    const beyondPrompt = !searchBeyondSources
      ? `\n\nBELANGRIJK: Gebruik ALLEEN de geïntegreerde bronnen (parlementaire databases, partijprogramma's, nieuwszoekmachine) en de eigen bronnen hierboven. Gebruik fetchWebPage NIET om andere websites te raadplegen.`
      : ""

    const prompt = `Genereer een uitgebreide debriefing over: "${topic}"${soort ? ` (type vergadering: ${soort})` : ""}

## Context
${partyName ? `**Partij:** ${partyName} - frame de gehele briefing vanuit het perspectief van deze partij. Zoek het verkiezingsprogramma op via searchPartyDocs.` : "Geen partij geselecteerd - geef een neutraal, gebalanceerd overzicht."}
${hasKamerleden ? `**Kamerleden:** ${kamerleden.join(", ")} - zoek hun standpunten, ingediende moties en schriftelijke vragen op over dit onderwerp.` : ""}
${sources.length > 0 ? `**Eigen bronnen:** Raadpleeg deze actief met fetchWebPage wanneer relevant:\n${sources.map((s) => s.title ? `- ${s.title}: ${s.url}` : `- ${s.url}`).join("\n")}` : ""}
${skillPrompt ? `\n${skillPrompt}` : `
## Onderzoek (maximaal 2 rondes, daarna DIRECT schrijven)
Ronde 1 - Voer ALLE zoekacties tegelijk uit:
- searchParlement: zoek relevante parlementaire documenten (primair)
- searchToezeggingen: zoek openstaande toezeggingen
- searchStemmingen: zoek stemgedrag
- searchNews: zoek actueel nieuws
- searchPartyDocs: zoek het partijstandpunt

Ronde 2 - Haal de volledige tekst op van maximaal 3 belangrijkste documenten met getDocumentText of getOpenTKDocument (parallel).

## Briefing
Schrijf daarna DIRECT de volledige briefing met deze secties:

## Samenvatting
## Relevante Stukken
Per stuk: nummer, datum, samenvatting van de inhoud.
## Moties en Amendementen
## Openstaande Toezeggingen
## Standpunten per Fractie
## Suggestievragen`}
${beyondPrompt}

Zoek de daadwerkelijke inhoud van relevante stukken op en vat samen wat erin staat. Noem altijd documentnummers en data.`

    const abortController = new AbortController()

    const result = streamText({
      model: getModel(),
      maxOutputTokens: 16384,
      abortSignal: abortController.signal,
      system: `Je bent een parlementair onderzoeksassistent die debriefings schrijft voor Kamerleden. Schrijf in het Nederlands. Gebruik NOOIT em dashes, gebruik gewone streepjes (-) of herformuleer de zin. Verwijs naar concrete documentnummers en Kamerstuknummers.

BELANGRIJK - voer ALTIJD meerdere zoekacties tegelijk uit in een enkele ronde. Roep NOOIT een tool alleen aan als je er meerdere tegelijk kunt aanroepen.

BUDGETBEWUST WERKEN - Je hebt een STRIKT budget van maximaal 12 tool-aanroepen verdeeld over maximaal 3 rondes. Overschrijding betekent dat de briefing niet wordt afgemaakt.
- Ronde 1 (VERPLICHT): Roep ALLE zoektools tegelijk aan. Gebruik searchParlement als primaire bron, aangevuld met searchToezeggingen, searchStemmingen, searchNews en searchPartyDocs. Gebruik searchOpenTK alleen als alternatief als searchParlement weinig resultaten geeft.
- Ronde 2 (VERPLICHT): Haal de volledige tekst op van maximaal 3 belangrijkste documenten met getDocumentText of getOpenTKDocument (parallel).
- Ronde 3: SCHRIJF de briefing. Doe GEEN extra onderzoek meer.

CRUCIALE REGEL: Na 2 rondes tool-aanroepen MOET je direct de briefing schrijven. Een complete briefing met beperkt onderzoek is ALTIJD beter dan uitgebreid onderzoek zonder briefing. Stop NOOIT na onderzoek zonder de briefing te schrijven.

Toolkeuze: searchParlement is de primaire zoektool (doorzoekt alle parlementaire documenten). Gebruik NIET zowel searchParlement als searchKamerstukken/searchDocumenten/searchHandelingen voor dezelfde query - deze overlappen. Gebruik de gespecialiseerde tools alleen als je specifiek toezeggingen, stemmingen, agenda of nieuws nodig hebt.

De instructies bevatten secties. Gebruik de sectienamen als kopjes (##) in de briefing. Begin NIET met een # titel of een inleidende zin zoals "Op basis van mijn onderzoek..." - start direct met het eerste ## kopje.

Bronvermelding: gebruik doorlopend genummerde voetnoten [1], [2], [3] etc. in de tekst bij elke feitelijke bewering, elk document of elk standpunt. Sluit de briefing af met een ## Bronnen sectie waarin alle voetnoten staan met het volledige documentnummer, titel, datum en/of URL. Voorbeeld:
[1] Kamerstuk 36 410-VIII nr. 45 - Kamerbrief over onderwijshuisvesting, 15 januari 2025
[2] Handelingen 2024-2025 nr. 12, item 5 - Plenair debat over klimaatbeleid
[3] NOS - "Kabinet trekt extra geld uit voor defensie", 3 maart 2025${beyondPrompt}`,
      prompt,
      stopWhen: stepCountIs(15),
      tools: {
        searchKamerstukken,
        searchHandelingen,
        searchToezeggingen,
        searchStemmingen,
        searchNews,
        fetchWebPage,
        searchAgenda,
        searchDocumenten,
        searchParlement,
        getDocumentText,
        getRecenteKamervragen,
        searchOpenTK,
        getOpenTKDocument,
        searchExa,
        searchPartyDocs: createSearchPartyDocs(
          partyId ?? null,
          organisationId ?? null
        ),
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      cancel() {
        abortController.abort()
      },
      async start(controller) {
        try {
          // Track text per step. Steps with tool calls contain "thinking out loud"
          // text (e.g. "Ik ga zoeken naar...") — we only keep text from steps
          // that have NO tool calls (= the actual briefing writing step).
          const stepTexts: { text: string; hasTools: boolean }[] = [{ text: "", hasTools: false }]

          // Process-oriented phases: always show 3 high-level steps
          const FETCH_TOOLS = new Set(["getDocumentText", "getOpenTKDocument", "fetchWebPage"])

          const processSteps = ["Bronnen zoeken", "Documenten lezen", "Briefing schrijven"]
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "steps", steps: processSteps }) + "\n")
          )

          // Track which process phases have been entered
          let currentPhase: "search" | "fetch" | "write" = "search"
          let hasSeenFetch = false

          for await (const part of result.fullStream) {
            if (part.type === "start-step") {
              stepTexts.push({ text: "", hasTools: false })
            } else if (part.type === "tool-call") {
              stepTexts[stepTexts.length - 1].hasTools = true

              // Advance phase based on tool type
              if (FETCH_TOOLS.has(part.toolName) && !hasSeenFetch) {
                hasSeenFetch = true
                currentPhase = "fetch"
                controller.enqueue(
                  encoder.encode(JSON.stringify({ type: "section", title: "Documenten lezen" }) + "\n")
                )
              }

              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool-call",
                    id: part.toolCallId,
                    tool: part.toolName,
                  }) + "\n"
                )
              )
            } else if (part.type === "tool-result") {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool-done",
                    id: part.toolCallId,
                    tool: part.toolName,
                  }) + "\n"
                )
              )
            } else if (part.type === "text-delta") {
              const current = stepTexts[stepTexts.length - 1]
              current.text += part.text

              // When text flows in a step without tool calls, we're writing
              if (!current.hasTools && currentPhase !== "write") {
                currentPhase = "write"
                controller.enqueue(
                  encoder.encode(JSON.stringify({ type: "section", title: "Briefing schrijven" }) + "\n")
                )
              }
            }
          }

          // Only keep text from steps without tool calls (= actual briefing writing)
          const fullText = stepTexts
            .filter((s) => !s.hasTools && s.text.trim())
            .map((s) => s.text)
            .join("\n\n")

          // Save to DB (cap at 500K to prevent oversized rows)
          const trimmedContent = fullText.slice(0, 500_000)
          if (userId && trimmedContent) {
            await db.insert(briefings).values({
              userId,
              organisationId: organisationId ?? null,
              partyId: partyId ?? null,
              topic,
              content: trimmedContent,
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
                message: "Er is een fout opgetreden bij het genereren van de briefing",
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
      headers["Set-Cookie"] = `session-id=${setSessionCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
    }
    return new Response(stream, { headers })
  } catch (error) {
    console.error("[briefing] ERROR:", error)
    return safeErrorResponse(error)
  }
}
