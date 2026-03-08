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
} from "@/lib/tools"
import { NextResponse } from "next/server"
import { getDefaultSkill, getDefaultSteps } from "@/lib/meeting-skills"
import { briefingBodySchema } from "@/lib/validation"

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

    // Resolve the meeting skill: user override > default for this soort > empty
    const skillPrompt = meetingSkill || (soort ? getDefaultSkill(soort) : "")

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
## Onderzoeksaanpak
1. Zoek via searchParlement naar relevante parlementaire documenten
2. Haal volledige teksten op via getDocumentText
3. Zoek aanvullend via searchKamerstukken, searchDocumenten, searchToezeggingen, searchStemmingen, searchHandelingen en searchNews

Schrijf de briefing met: Samenvatting, Relevante Stukken (per stuk: nummer, datum, samenvatting), Moties en Amendementen, Openstaande Toezeggingen, Standpunten per Fractie, Suggestievragen.`}
${beyondPrompt}

Zoek de daadwerkelijke inhoud van relevante stukken op en vat samen wat erin staat. Noem altijd documentnummers en data.`

    const abortController = new AbortController()

    const result = streamText({
      model: getModel(),
      abortSignal: abortController.signal,
      system: `Je bent een parlementair onderzoeksassistent die debriefings schrijft voor Kamerleden. Schrijf in het Nederlands. Gebruik NOOIT em dashes, gebruik gewone streepjes (-) of herformuleer de zin. Verwijs naar concrete documentnummers en Kamerstuknummers.

Werkwijze:
1. Gebruik searchParlement als primaire zoekmachine - dit doorzoekt alle parlementaire documenten via full-text search op Overheid.nl
2. Haal de volledige tekst van belangrijke documenten op via getDocumentText
3. Gebruik searchDocumenten en searchKamerstukken voor aanvullende gestructureerde zoekopdrachten
4. Gebruik searchToezeggingen, searchStemmingen, searchHandelingen en searchNews voor context
5. Gebruik getRecenteKamervragen voor recente schriftelijke vragen
6. Vat elk relevant document bondig maar volledig samen met concrete feiten en cijfers
7. Voer meerdere zoekacties parallel uit waar mogelijk

Doe eerst al je onderzoek met tools, en schrijf daarna direct de volledige briefing. Vraag niet om bevestiging tussendoor - ga altijd automatisch door van onderzoek naar het schrijven van het eindproduct.

De instructies bevatten genummerde stappen. Doorloop deze stappen en gebruik de stapnamen als kopjes (##) in de briefing.${beyondPrompt}`,
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
        searchParlement,
        getDocumentText,
        getRecenteKamervragen,
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
          let fullText = ""

          // Send deliverable steps to client for progress sidebar
          const skillSteps = soort ? getDefaultSteps(soort) : []
          // Map normalized step name → original label for display
          const stepMap = new Map(skillSteps.map((s) => [s.toLowerCase().trim(), s]))
          const sentSections = new Set<string>()

          if (skillSteps.length > 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "steps", steps: skillSteps }) + "\n")
            )
          }

          for await (const part of result.fullStream) {
            if (part.type === "start-step") {
              // Reset text at each new step — only the final step's text
              // is the actual briefing; intermediate steps contain
              // "thinking-out-loud" text between tool calls (#21)
              fullText = ""
              sentSections.clear()
            } else if (part.type === "tool-call") {
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
              fullText += part.text

              // Detect section headers matching skill steps.
              // The AI may write "## Stap 1 - Agendaoverzicht" or just "## Agendaoverzicht",
              // so we check if the header *contains* any step name rather than exact match.
              const headerRegex = /^## (.+)$/gm
              let match
              while ((match = headerRegex.exec(fullText)) !== null) {
                const headerText = match[1].trim().toLowerCase()
                for (const [normalized, original] of stepMap) {
                  if (!sentSections.has(normalized) && headerText.includes(normalized)) {
                    sentSections.add(normalized)
                    controller.enqueue(
                      encoder.encode(JSON.stringify({ type: "section", title: original }) + "\n")
                    )
                    break
                  }
                }
              }
            }
          }

          // Save to DB
          if (userId && fullText) {
            await db.insert(briefings).values({
              userId,
              organisationId: organisationId ?? null,
              partyId: partyId ?? null,
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
