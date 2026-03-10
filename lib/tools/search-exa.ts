import { tool } from "ai"
import { z } from "zod"

const EXA_API_URL = "https://api.exa.ai/search"

interface ExaResult {
  url: string
  title: string
  publishedDate?: string
  author?: string
  text?: string
  highlights?: string[]
}

async function exaSearch(
  query: string,
  opts: {
    category?: string
    includeDomains?: string[]
    numResults?: number
    startPublishedDate?: string
  },
): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error("EXA_API_KEY ontbreekt")

  const body: Record<string, unknown> = {
    query,
    type: "auto",
    numResults: opts.numResults ?? 10,
    contents: {
      text: { maxCharacters: 1500 },
      highlights: { maxCharacters: 300 },
    },
  }
  if (opts.category) body.category = opts.category
  if (opts.includeDomains) body.includeDomains = opts.includeDomains
  if (opts.startPublishedDate) body.startPublishedDate = opts.startPublishedDate

  const res = await fetch(EXA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Exa API error ${res.status}: ${(err as Record<string, string>).error ?? res.statusText}`)
  }

  const data = await res.json()
  return (data.results ?? []) as ExaResult[]
}

function formatResults(results: ExaResult[]) {
  return results.map((r) => ({
    title: r.title,
    url: r.url,
    date: r.publishedDate ?? undefined,
    author: r.author ?? undefined,
    snippet:
      r.highlights?.[0] ??
      (r.text ? r.text.slice(0, 300) : undefined),
  }))
}

export const searchExa = tool({
  description:
    "Doorzoek het web, X/Twitter en LinkedIn via Exa. Gebruik 'scope' om te kiezen: 'web' voor algemeen zoeken, 'twitter' voor tweets/posts op X, 'linkedin' voor LinkedIn-profielen en posts. Goed voor actuele discussies, meningen en social media context.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm, bijv. 'stikstofbeleid debat' of 'minister AI beleid'"),
    scope: z
      .enum(["web", "twitter", "linkedin"])
      .default("web")
      .describe("Zoekbereik: 'web' (algemeen), 'twitter' (X/tweets), 'linkedin' (profielen/posts)"),
    maxResults: z.number().int().min(1).max(20).optional().default(10),
    recentDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .describe("Beperk tot de laatste N dagen. Handig voor actuele discussies."),
  }),
  execute: async ({ query, scope, maxResults, recentDays }) => {
    if (!process.env.EXA_API_KEY) {
      return {
        count: 0,
        results: [],
        error: "Exa-zoeken is niet geconfigureerd (EXA_API_KEY ontbreekt)",
      }
    }

    let startPublishedDate: string | undefined
    if (recentDays) {
      const d = new Date()
      d.setDate(d.getDate() - recentDays)
      startPublishedDate = d.toISOString()
    }

    try {
      let results: ExaResult[]

      switch (scope) {
        case "twitter":
          results = await exaSearch(query, {
            category: "tweet",
            numResults: maxResults,
            startPublishedDate,
          })
          break
        case "linkedin":
          results = await exaSearch(query, {
            includeDomains: ["linkedin.com"],
            numResults: maxResults,
            startPublishedDate,
          })
          break
        default:
          results = await exaSearch(query, {
            numResults: maxResults,
            startPublishedDate,
          })
      }

      return {
        count: results.length,
        scope,
        results: formatResults(results),
      }
    } catch (error) {
      return {
        count: 0,
        results: [],
        error: String(error instanceof Error ? error.message : error),
      }
    }
  },
})
