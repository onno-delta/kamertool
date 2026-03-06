import { streamText, stepCountIs, convertToModelMessages } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import { auth } from "@/auth"
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

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, partyId, partyName, organisationId, model: requestedModel } = await req.json()

    const session = await auth()
    const userId = session?.user?.id ?? null

    // Check for user's own API key
    let modelOpts: { model?: string; apiKey?: string } | undefined
    let usingOwnKey = false

    if (userId) {
      const userKey = await getActiveKey(userId)
      if (userKey) {
        modelOpts = { model: userKey.model, apiKey: userKey.apiKey }
        usingOwnKey = true
      }
    }

    // Free tier rate limiting (skip for BYOK and whitelisted domains)
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
            message: `Dagelijkse limiet bereikt (${limit} berichten). Voeg je eigen API key toe in Instellingen voor onbeperkt gebruik.`,
            used,
            limit,
          },
          { status: 429 }
        )
      }
    }

    // Use BYOK model if set, otherwise use requested model from toolbar
    if (!modelOpts && requestedModel) {
      modelOpts = { model: requestedModel }
    }

    const tools = {
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
    }

    const modelMessages = await convertToModelMessages(messages, { tools })

    const result = streamText({
      model: getModel(modelOpts),
      system: buildSystemPrompt(partyName),
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
