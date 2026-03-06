import { tool } from "ai"
import { z } from "zod"
import { queryTK, buildContainsFilter } from "@/lib/tk-api"

export const searchToezeggingen = tool({
  description:
    "Zoek toezeggingen van ministers. Dit zijn beloftes die ministers aan de Kamer hebben gedaan. Erg nuttig om ministers aan te spreken op openstaande toezeggingen.",
  inputSchema: z.object({
    query: z.string().describe("Zoekterm in de toezeggingstekst"),
    statusFilter: z
      .enum(["Openstaand", "Afgedaan", ""])
      .optional()
      .default("Openstaand")
      .describe(
        "Filter op status. 'Openstaand' = nog niet nagekomen, 'Afgedaan' = afgerond.",
      ),
    maxResults: z.number().int().min(1).max(25).optional().default(10),
  }),
  execute: async ({ query, statusFilter, maxResults }) => {
    const textFilter = buildContainsFilter(query, ["Tekst"])
    let filter = textFilter ? `${textFilter} and Verwijderd eq false` : "Verwijderd eq false"
    if (statusFilter) filter += ` and Status eq '${statusFilter}'`

    const results = await queryTK("Toezegging", {
      $filter: filter,
      $select:
        "Id,Nummer,Tekst,Status,DatumNakoming,Ministerie,Naam,Functie",
      $orderby: "DatumNakoming desc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      results: results.map((t: Record<string, unknown>) => ({
        nummer: t.Nummer,
        tekst: t.Tekst,
        status: t.Status,
        datumNakoming: t.DatumNakoming,
        ministerie: t.Ministerie,
        minister: t.Naam,
        functie: t.Functie,
      })),
    }
  },
})
