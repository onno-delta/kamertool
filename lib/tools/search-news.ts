import { tool } from "ai"
import { z } from "zod"

export const searchNews = tool({
  description:
    "Zoek recent nieuws over een onderwerp. Doorzoekt NOS, RTVNieuws, Volkskrant, NRC en Rijksoverheid.nl voor actuele context.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm voor het nieuwsonderwerp"),
    maxResults: z.number().int().min(1).max(10).optional().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    if (!process.env.SERPER_API_KEY) {
      return { count: 0, results: [], error: "Nieuwszoeken is niet geconfigureerd (SERPER_API_KEY ontbreekt)" }
    }

    const res = await fetch("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "nl",
        hl: "nl",
        num: maxResults,
      }),
    })

    if (!res.ok)
      return { count: 0, results: [], error: "News search unavailable" }

    const data = await res.json()
    const articles = (data.news ?? []).map((article: Record<string, string>) => ({
      title: article.title,
      snippet: article.snippet,
      source: article.source,
      url: article.link,
      date: article.date,
    }))

    return { count: articles.length, results: articles }
  },
})
