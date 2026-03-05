import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import { auth } from "@/auth"
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

export const maxDuration = 60

export async function POST(req: Request) {
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

  // Free tier rate limiting (only when not using own key)
  if (!usingOwnKey) {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("session-id")?.value ?? null
    if (!sessionId && !userId) {
      sessionId = crypto.randomUUID()
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

  const result = streamText({
    model: getModel(modelOpts),
    system: buildSystemPrompt(partyName),
    messages,
    stopWhen: stepCountIs(10),
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

  return result.toUIMessageStreamResponse()
}
