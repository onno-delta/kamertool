import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

export const searchStemmingen = tool({
  description:
    "Zoek stemmingsuitslagen over moties, amendementen en wetsvoorstellen. Laat zien welke fracties voor of tegen hebben gestemd.",
  inputSchema: z.object({
    zaakId: z
      .string()
      .describe(
        "Het ID van de Zaak (motie/amendement) om stemmingen voor op te zoeken",
      ),
  }),
  execute: async ({ zaakId }) => {
    const besluiten = await queryTK("Besluit", {
      $filter: `Zaak_Id eq ${zaakId} and StemmingsSoort ne null and Verwijderd eq false`,
      $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
      $expand:
        "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte)",
    })

    return {
      count: besluiten.length,
      results: besluiten.map((b: Record<string, unknown>) => ({
        besluit: b.BesluitTekst,
        soort: b.StemmingsSoort,
        stemmingen: (
          (b.Stemming as Array<Record<string, unknown>>) ?? []
        ).map((s) => ({
          fractie: s.ActorFractie || s.ActorNaam,
          stem: s.Soort,
          zetels: s.FractieGrootte,
        })),
      })),
    }
  },
})
