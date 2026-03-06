import { tool } from "ai"
import { z } from "zod"
import { queryTK, buildContainsFilter } from "@/lib/tk-api"

export const searchDocumenten = tool({
  description:
    "Zoek in parlementaire documenten: Kamerbrieven, nota's, verslagen, amendementen, moties en andere stukken die naar de Kamer zijn gestuurd. Geeft documentnummers en URLs terug. Gebruik fetchWebPage om de inhoud van een specifiek document op te halen via de URL.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Zoekterm voor het onderwerp van het document"),
    type: z
      .enum([
        "Brief regering",
        "Motie",
        "Amendement",
        "Nota naar aanleiding van het verslag",
        "Nota van wijziging",
        "Memorie van toelichting",
        "Verslag",
        "Schriftelijke vragen",
        "Antwoord schriftelijke vragen",
        "Voorstel van wet",
        "",
      ])
      .optional()
      .describe("Filter op documenttype. Laat leeg voor alle types."),
    maxResults: z.number().int().min(1).max(20).optional().default(10),
  }),
  execute: async ({ query, type, maxResults }) => {
    const textFilter = buildContainsFilter(query, ["Onderwerp", "Titel"])
    let filter = textFilter ? `${textFilter} and Verwijderd eq false` : "Verwijderd eq false"
    if (type) filter += ` and Soort eq '${type}'`

    const results = await queryTK("Document", {
      $filter: filter,
      $select:
        "Id,DocumentNummer,Soort,Titel,Onderwerp,Datum,Volgnummer,DatumRegistratie",
      $orderby: "DatumRegistratie desc",
      $top: String(maxResults),
    })

    return {
      count: results.length,
      results: results.map((d: Record<string, unknown>) => ({
        documentNummer: d.DocumentNummer,
        type: d.Soort,
        titel: d.Titel,
        onderwerp: d.Onderwerp,
        datum: d.Datum,
        url: `https://www.tweedekamer.nl/kamerstukken/detail?id=${d.DocumentNummer}&did=${d.DocumentNummer}`,
      })),
    }
  },
})
