import { tool } from "ai"
import { z } from "zod"

export const fetchWebPage = tool({
  description:
    "Haal de inhoud op van een webpagina. Gebruik dit wanneer de gebruiker een URL deelt of als je meer informatie nodig hebt van een specifieke webpagina, bijvoorbeeld van tweedekamer.nl.",
  inputSchema: z.object({
    url: z.string().url().describe("De URL van de webpagina om op te halen"),
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Kamertool/1.0; +https://kamer.deltainstituut.nl)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        return { error: `HTTP ${res.status}: ${res.statusText}`, content: null }
      }

      const contentType = res.headers.get("content-type") ?? ""
      if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
        return { error: `Unsupported content type: ${contentType}`, content: null }
      }

      const html = await res.text()

      // Extract text content by stripping HTML tags
      const text = extractText(html)

      // Truncate to avoid blowing up context
      const maxLen = 12000
      const truncated = text.length > maxLen
      const content = truncated ? text.slice(0, maxLen) + "\n\n[... inhoud afgekapt]" : text

      return {
        url,
        title: extractTitle(html),
        content,
        truncated,
        length: text.length,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Ophalen mislukt: ${message}`, content: null }
    }
  },
})

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? decodeEntities(match[1].trim()) : null
}

function extractText(html: string): string {
  let text = html
    // Remove script and style blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    // Remove nav, header, footer elements (common boilerplate)
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    // Convert block elements to newlines
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}
