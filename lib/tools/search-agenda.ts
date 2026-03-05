import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

const DEBATE_TYPES = [
  "Plenair debat",
  "Commissiedebat",
  "Wetgevingsoverleg",
  "Tweeminutendebat",
  "Notaoverleg",
  "Begrotingsoverleg",
]

export const searchAgenda = tool({
  description:
    "Zoek komende debatten en vergaderingen in de Tweede Kamer agenda. Gebruik dit om te zien welke debatten er gepland staan, deze week, volgende week, of in een bepaalde periode. Filtert standaard op plenaire debatten, commissiedebatten, wetgevingsoverleggen en tweeminutendebatten.",
  inputSchema: z.object({
    daysAhead: z
      .number()
      .int()
      .min(1)
      .max(90)
      .optional()
      .default(14)
      .describe("Aantal dagen vooruit om te zoeken (standaard 14)"),
    query: z
      .string()
      .optional()
      .describe("Optionele zoekterm om te filteren op onderwerp"),
    includeAll: z
      .boolean()
      .optional()
      .default(false)
      .describe("Toon ook procedurevergaderingen, gesprekken etc. (standaard alleen debatten)"),
    maxResults: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ daysAhead, query, includeAll, maxResults }) => {
    const now = new Date()
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    const fromStr = now.toISOString().split("T")[0] + "T00:00:00Z"
    const untilStr = until.toISOString().split("T")[0] + "T23:59:59Z"

    let filter = `Datum ge ${fromStr} and Datum le ${untilStr} and Verwijderd eq false and Status ne 'Geannuleerd' and Status ne 'Verplaatst'`

    if (!includeAll) {
      const typeFilters = DEBATE_TYPES.map((t) => `Soort eq '${t}'`).join(" or ")
      filter += ` and (${typeFilters})`
    }

    if (query) {
      filter += ` and contains(Onderwerp,'${query}')`
    }

    const results = await queryTK("Activiteit", {
      $filter: filter,
      $select: "Id,Soort,Nummer,Onderwerp,Datum,Aanvangstijd,Eindtijd,Status,Voortouwnaam",
      $orderby: "Datum asc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      period: `${now.toISOString().split("T")[0]} t/m ${until.toISOString().split("T")[0]}`,
      results: results.map((a: Record<string, unknown>) => ({
        id: a.Id,
        type: a.Soort,
        nummer: a.Nummer,
        onderwerp: a.Onderwerp,
        datum: a.Datum,
        aanvang: a.Aanvangstijd,
        einde: a.Eindtijd,
        status: a.Status,
        commissie: a.Voortouwnaam,
      })),
    }
  },
})
