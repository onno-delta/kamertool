import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchKamerstukken = tool({
  description:
    "Zoek in Kamerstukken, moties, amendementen en wetsvoorstellen van de Tweede Kamer. Gebruik dit om parlementaire geschiedenis en context over een onderwerp te vinden.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Zoekterm voor het onderwerp, bijv. 'stikstof' of 'woningbouw'",
      ),
    type: z
      .enum([
        "Motie",
        "Amendement",
        "Wetsvoorstel",
        "Brief regering",
        "Schriftelijke vragen",
        "",
      ])
      .optional()
      .describe("Filter op type Kamerstuk. Laat leeg voor alle types."),
    maxResults: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ query, type, maxResults }) => {
    let filter = `(contains(Onderwerp,'${query}') or contains(Titel,'${query}')) and Verwijderd eq false`
    if (type) filter += ` and Soort eq '${type}'`

    const results = await queryTK("Zaak", {
      $filter: filter,
      $select: "Id,Nummer,Soort,Titel,Onderwerp,Status,GestartOp",
      $orderby: "GestartOp desc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      results: results.map((z: Record<string, unknown>) => ({
        id: z.Id,
        nummer: z.Nummer,
        type: z.Soort,
        titel: z.Titel,
        onderwerp: z.Onderwerp,
        datum: z.GestartOp,
      })),
    }
  },
})
