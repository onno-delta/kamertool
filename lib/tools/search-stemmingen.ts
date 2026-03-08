import { tool } from "ai"
import { z } from "zod"
import { queryTK, buildContainsFilter } from "@/lib/tk-api"

export const searchStemmingen = tool({
  description:
    "Zoek stemmingsuitslagen over moties, amendementen en wetsvoorstellen. Laat zien welke fracties voor of tegen hebben gestemd. Gebruik 'query' om op onderwerp te zoeken, of 'zaakId' als je het exacte Zaak-ID hebt uit eerdere zoekresultaten.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        "Zoekterm voor het onderwerp, bijv. 'stikstof' of 'woningbouw'. Zoekt in Zaak-onderwerp/titel.",
      ),
    zaakId: z
      .string()
      .optional()
      .describe(
        "Het exacte UUID van de Zaak (motie/amendement) uit eerdere zoekresultaten. Gebruik bij voorkeur 'query' als je geen zaakId hebt.",
      ),
    maxResults: z.number().int().min(1).max(20).optional().default(10),
  }),
  execute: async ({ query, zaakId, maxResults }) => {
    // Direct lookup by zaakId
    if (zaakId) {
      const besluiten = await queryTK("Besluit", {
        $filter: `Zaak_Id eq ${zaakId} and StemmingsSoort ne null and Verwijderd eq false`,
        $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
        $expand:
          "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte)",
      })

      return {
        count: besluiten.length,
        results: besluiten.map(formatBesluit),
      }
    }

    // Search by query: first find relevant Zaken, then get their stemmingen
    if (!query) {
      return { count: 0, results: [], error: "Geef een 'query' of 'zaakId' op." }
    }

    const textFilter = buildContainsFilter(query, ["Onderwerp", "Titel"])
    if (!textFilter) {
      return { count: 0, results: [] }
    }

    // Find Zaken that have stemmingen (BesluitSoort contains stemming info)
    const zaken = await queryTK("Zaak", {
      $filter: `${textFilter} and Verwijderd eq false`,
      $select: "Id,Nummer,Soort,Onderwerp,Titel,GestartOp",
      $orderby: "GestartOp desc",
      $top: String(maxResults),
    })

    if (zaken.length === 0) {
      return { count: 0, results: [] }
    }

    // For each zaak, fetch besluiten with stemmingen
    const zaakIds = zaken.map((z: Record<string, unknown>) => z.Id as string)
    const filterParts = zaakIds.map((id: string) => `Zaak_Id eq ${id}`)
    const besluiten = await queryTK("Besluit", {
      $filter: `(${filterParts.join(" or ")}) and StemmingsSoort ne null and Verwijderd eq false`,
      $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort,Zaak_Id",
      $expand:
        "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte)",
      $top: "50",
    })

    // Enrich besluiten with zaak metadata
    const zaakMap = new Map(
      zaken.map((z: Record<string, unknown>) => [z.Id, z]),
    )

    return {
      count: besluiten.length,
      results: besluiten.map((b: Record<string, unknown>) => {
        const zaak = zaakMap.get(b.Zaak_Id) as Record<string, unknown> | undefined
        return {
          ...formatBesluit(b),
          zaak: zaak
            ? {
                nummer: zaak.Nummer,
                type: zaak.Soort,
                onderwerp: zaak.Onderwerp || zaak.Titel,
                datum: zaak.GestartOp,
              }
            : undefined,
        }
      }),
    }
  },
})

function formatBesluit(b: Record<string, unknown>) {
  return {
    besluit: b.BesluitTekst,
    soort: b.StemmingsSoort,
    stemmingen: (
      (b.Stemming as Array<Record<string, unknown>>) ?? []
    ).map((s) => ({
      fractie: s.ActorFractie || s.ActorNaam,
      stem: s.Soort,
      zetels: s.FractieGrootte,
    })),
  }
}
