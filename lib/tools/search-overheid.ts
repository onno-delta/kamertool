import { tool } from "ai"
import { z } from "zod"
import { querySRU, buildSearchCQL, fetchDocumentText } from "@/lib/sru-api"

export const searchParlement = tool({
  description:
    "Zoek in alle parlementaire documenten via Overheid.nl (Kamerstukken, Handelingen, Kamervragen). Full-text zoekmachine over alle gepubliceerde parlementaire stukken. Geeft documentnummers, titels, datums en type terug.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Zoekterm. Meerdere woorden = alle moeten voorkomen. Aanhalingstekens voor exacte frase."
      ),
    soorten: z
      .string()
      .optional()
      .describe(
        "Filter op documentsoort: 'Brief regering', 'Motie', 'Amendement', 'Verslag', 'Schriftelijke vragen'. Laat leeg voor alle soorten."
      ),
    recentOnly: z
      .boolean()
      .optional()
      .default(false)
      .describe("Alleen resultaten van de afgelopen twee maanden"),
  }),
  execute: async ({ query, soorten, recentOnly }) => {
    try {
      const dateFrom = recentOnly
        ? new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        : undefined

      const cql = buildSearchCQL(query, { soorten, dateFrom })
      const { totalResults, records } = await querySRU(cql, 15)

      return {
        count: records.length,
        totalResults,
        results: records.map((r) => ({
          nummer: r.docId !== r.identifier ? r.docId : r.identifier,
          onderwerp: r.title,
          datum: r.date,
          type: r.subrubriek || r.type,
          indiener: r.indiener || undefined,
          dossiernummer: r.dossiernummer || undefined,
          url: r.url,
        })),
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Zoeken mislukt: ${message}`, results: [] }
    }
  },
})

export const getDocumentText = tool({
  description:
    "Haal de volledige tekst op van een parlementair document via Overheid.nl. Gebruik een documentnummer (bijv. 'kst-36748-30' of 'h-tk-20252026-32-16') dat je hebt gevonden via searchParlement. Geeft de tekstinhoud van het document terug.",
  inputSchema: z.object({
    nummer: z
      .string()
      .describe("Het documentnummer, bijv. 'kst-36748-30' of 'h-tk-20252026-32-16'"),
  }),
  execute: async ({ nummer }) => {
    try {
      let text = await fetchDocumentText(nummer)

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
    "Haal de meest recente schriftelijke Kamervragen op via Overheid.nl. Geeft een lijst van recent ingediende vragen met indiener, onderwerp en documentnummer.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)

      const cql = `overheidop.publicationName="Kamervragen zonder antwoord" AND dcterms.modified >= "${thirtyDaysAgo}"`
      const { totalResults, records } = await querySRU(cql, 20)

      return {
        count: records.length,
        totalResults,
        results: records.map((r) => ({
          nummer: r.identifier,
          onderwerp: r.title,
          indiener: r.indiener || undefined,
          datum: r.date,
        })),
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Ophalen mislukt: ${message}`, results: [] }
    }
  },
})
