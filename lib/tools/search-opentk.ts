import { tool } from "ai"
import { z } from "zod"

const OPENTK_BASE = "https://berthub.eu/tkconv"

export const searchOpenTK = tool({
  description:
    "Zoek in alle parlementaire documenten via OpenTK (opentk.nl). Krachtige full-text zoekmachine over alle Kamerstukken, verslagen, brieven, moties etc. Ondersteunt AND, OR, NOT, NEAR(), aanhalingstekens voor exacte frase, en prefix-zoeken (bijv. HOL0*). Geeft documentnummers, titels, datums en relevante snippets terug.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Zoekterm. Meerdere woorden = alle moeten voorkomen. Aanhalingstekens voor exacte frase. NEAR(woord1 woord2) voor nabijheid. AND/OR/NOT voor boolean."
      ),
    soorten: z
      .string()
      .optional()
      .describe(
        "Filter op documentsoort, bijv. 'Brief regering', 'Motie', 'Amendement', 'Schriftelijke vragen'. Laat leeg voor alle soorten."
      ),
    recentOnly: z
      .boolean()
      .optional()
      .default(false)
      .describe("Alleen resultaten van de afgelopen twee maanden"),
  }),
  execute: async ({ query, soorten, recentOnly }) => {
    try {
      const formData = new FormData()
      formData.append("q", query)
      if (soorten) formData.append("soorten", soorten)
      if (recentOnly) formData.append("twomonths", "true")

      const res = await fetch(`${OPENTK_BASE}/search`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        return { error: `OpenTK zoeken mislukt: HTTP ${res.status}`, results: [] }
      }

      const data = await res.json()
      const results = (data.results ?? []).slice(0, 15)

      return {
        count: results.length,
        totalTime: data.milliseconds ? `${Math.round(data.milliseconds)}ms` : undefined,
        results: results.map(
          (r: {
            nummer: string
            onderwerp: string
            datum: string
            category: string
            snip: string
            score: number
          }) => ({
            nummer: r.nummer,
            onderwerp: r.onderwerp,
            datum: r.datum,
            type: r.category,
            snippet: r.snip?.replace(/<\/?b>/g, "**"),
            url: `https://berthub.eu/tkconv/document.html?nummer=${r.nummer}`,
          })
        ),
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `OpenTK zoeken mislukt: ${message}`, results: [] }
    }
  },
})

export const getOpenTKDocument = tool({
  description:
    "Haal de volledige tekst op van een parlementair document via OpenTK. Gebruik een documentnummer (bijv. '2026D10162') dat je hebt gevonden via searchOpenTK. Geeft de tekstinhoud van het document terug.",
  inputSchema: z.object({
    nummer: z
      .string()
      .describe("Het documentnummer, bijv. '2026D10162' of '2025Z12345'"),
  }),
  execute: async ({ nummer }) => {
    try {
      const res = await fetch(`${OPENTK_BASE}/getdoc/${encodeURIComponent(nummer)}`, {
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        return { error: `Document ophalen mislukt: HTTP ${res.status}`, content: null }
      }

      const html = await res.text()

      // Extract text from HTML
      let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/[ \t]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

      const maxLen = 8000
      const truncated = text.length > maxLen
      if (truncated) text = text.slice(0, maxLen) + "\n\n[... inhoud afgekapt]"

      return { nummer, content: text, truncated, length: text.length }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Document ophalen mislukt: ${message}`, content: null }
    }
  },
})

export const getRecenteKamervragen = tool({
  description:
    "Haal de meest recente schriftelijke Kamervragen op via OpenTK. Geeft een lijst van recent ingediende vragen met indiener, onderwerp en documentnummer.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const res = await fetch(`${OPENTK_BASE}/recente-kamervragen`, {
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        return { error: `Ophalen mislukt: HTTP ${res.status}`, results: [] }
      }

      const data = await res.json()
      const results = (data as Array<{
        nummer: string
        onderwerp: string
        naam: string
        gestartOp: string
      }>).slice(0, 20)

      return {
        count: results.length,
        results: results.map((r) => ({
          nummer: r.nummer,
          onderwerp: r.onderwerp,
          indiener: r.naam,
          datum: r.gestartOp,
        })),
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Ophalen mislukt: ${message}`, results: [] }
    }
  },
})
