import { tool } from "ai"
import { z } from "zod"
import { queryTK, buildContainsFilter } from "@/lib/tk-api"

export const searchHandelingen = tool({
  description:
    "Zoek in debatten en vergaderingen van de Tweede Kamer. Vindt welke debatten er over een onderwerp zijn gevoerd en wanneer.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm voor het debatonderwerp"),
    maxResults: z.number().int().min(1).max(25).optional().default(10),
  }),
  execute: async ({ query, maxResults }) => {
    const textFilter = buildContainsFilter(query, ["Onderwerp"])
    const filter = textFilter
      ? `${textFilter} and Verwijderd eq false`
      : "Verwijderd eq false"

    const agendapunten = await queryTK("Agendapunt", {
      $filter: filter,
      $select: "Id,Onderwerp,Nummer,Volgorde,Activiteit_Id",
      $orderby: "GewijzigdOp desc",
      $top: String(maxResults),
    })

    // Batch-fetch activiteiten in a single OData query instead of N+1 calls
    const activiteitIds = agendapunten
      .filter((ap: Record<string, unknown>) => ap.Activiteit_Id)
      .map((ap: Record<string, unknown>) => ap.Activiteit_Id as string)

    const activiteitMap = new Map<string, Record<string, unknown>>()
    if (activiteitIds.length > 0) {
      const idFilter = activiteitIds.map((id: string) => `Id eq ${id}`).join(" or ")
      const activiteiten = await queryTK("Activiteit", {
        $filter: `(${idFilter}) and Verwijderd eq false`,
        $select: "Id,Soort,Datum,Onderwerp,Aanvang,Einde",
        $top: String(activiteitIds.length),
      }).catch(() => [])
      for (const a of activiteiten) {
        activiteitMap.set(a.Id as string, a)
      }
    }

    const results = agendapunten
      .filter((ap: Record<string, unknown>) => ap.Activiteit_Id)
      .map((ap: Record<string, unknown>) => {
        const activiteit = activiteitMap.get(ap.Activiteit_Id as string)
        return {
          onderwerp: ap.Onderwerp,
          activiteit: activiteit ? {
            soort: activiteit.Soort,
            datum: activiteit.Datum,
            onderwerp: activiteit.Onderwerp,
          } : null,
        }
      })

    return { count: results.length, results }
  },
})
