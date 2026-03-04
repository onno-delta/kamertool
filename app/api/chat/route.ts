import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
} from "@/lib/tools"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, partyId, partyName, organisationId } = await req.json()

  const result = streamText({
    model: getModel(),
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
