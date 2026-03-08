import { streamText, stepCountIs, convertToModelMessages } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { userSources } from "@/lib/db/schema"
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
import { chatBodySchema } from "@/lib/validation"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = chatBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { messages, partyId, partyName, organisationId, model: requestedModel } = parsed.data

    const session = await auth()
    const userId = session?.user?.id ?? null

    // Free tier rate limiting (skip for whitelisted domains)
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
            message: `Dagelijkse limiet bereikt (${limit} berichten). Voeg je eigen API key toe in Instellingen voor onbeperkt gebruik.`,
            used,
            limit,
          },
          { status: 429 }
        )
      }
    }

    const modelOpts = requestedModel ? { model: requestedModel } : undefined

    const tools = {
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
    }

    // Fetch user's priority sources
    const sources = userId
      ? await db.select({ url: userSources.url, title: userSources.title }).from(userSources).where(eq(userSources.userId, userId))
      : []

    const modelMessages = await convertToModelMessages(messages, { tools })

    const result = streamText({
      model: getModel(modelOpts),
      system: buildSystemPrompt(partyName, sources),
      messages: modelMessages,
      stopWhen: stepCountIs(10),
      tools,
    })

    const response = result.toUIMessageStreamResponse()
    if (setSessionCookie) {
      const cookie = `session-id=${setSessionCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
      const headers = new Headers(response.headers)
      headers.append("Set-Cookie", cookie)
      const cloned = response.clone()
      return new Response(cloned.body, { status: cloned.status, headers })
    }
    return response
  } catch (error) {
    console.error("[chat] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
