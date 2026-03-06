import { tool } from "ai"
import { z } from "zod"
import { queryTK, queryTKSingle, buildContainsFilter } from "@/lib/tk-api"

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

    const results = []
    for (const ap of agendapunten.slice(0, maxResults)) {
      if (!ap.Activiteit_Id) continue
      const activiteit = await queryTKSingle(
        `Activiteit(${ap.Activiteit_Id})`,
        { $select: "Id,Soort,Datum,Onderwerp,Aanvang,Einde" },
      ).catch(() => null)

      results.push({
        onderwerp: ap.Onderwerp,
        activiteit: activiteit
          ? {
              soort: activiteit.Soort,
              datum: activiteit.Datum,
              onderwerp: activiteit.Onderwerp,
            }
          : null,
      })
    }

    return { count: results.length, results }
  },
})
