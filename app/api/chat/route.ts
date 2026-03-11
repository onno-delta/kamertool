import { streamText, stepCountIs, convertToModelMessages } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, userSources } from "@/lib/db/schema"
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
import { chatBodySchema } from "@/lib/validation"
import { safeErrorResponse } from "@/lib/errors"

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = chatBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { messages, partyId, partyName, kamerlidNaam, organisationId, model: requestedModel } = parsed.data

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
      searchOpenTK,
      getOpenTKDocument,
      searchExa,
      searchPartyDocs: createSearchPartyDocs(
        partyId ?? null,
        organisationId ?? null
      ),
    }

    // Fetch user's priority sources + search-beyond preference
    const sources = userId
      ? await db.select({ url: userSources.url, title: userSources.title }).from(userSources).where(eq(userSources.userId, userId))
      : []
    let searchBeyondSources = true
    if (userId) {
      const [user] = await db.select({ searchBeyondSources: users.searchBeyondSources }).from(users).where(eq(users.id, userId)).limit(1)
      if (user) searchBeyondSources = user.searchBeyondSources
    }

    // Zod .passthrough() preserves all fields but its output type doesn't exactly
    // match UIMessage. The runtime data is correct, so we use a type assertion.
    const modelMessages = await convertToModelMessages(messages as any, { tools })

    const result = streamText({
      model: getModel(modelOpts),
      maxOutputTokens: 8192,
      system: buildSystemPrompt(partyName, sources, searchBeyondSources, kamerlidNaam),
      messages: modelMessages,
      stopWhen: stepCountIs(10),
      tools,
    })

    const response = result.toUIMessageStreamResponse({ sendReasoning: false })
    if (setSessionCookie) {
      const cookie = `session-id=${setSessionCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`
      const headers = new Headers(response.headers)
      headers.append("Set-Cookie", cookie)
      const cloned = response.clone()
      return new Response(cloned.body, { status: cloned.status, headers })
    }
    return response
  } catch (error) {
    console.error("[chat] ERROR:", error)
    return safeErrorResponse(error)
  }
}
