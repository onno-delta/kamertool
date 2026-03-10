import { tool } from "ai"
import { z } from "zod"
import { queryTK } from "@/lib/tk-api"

/**
 * Build a Zaak/any() lambda filter for searching within the Besluit→Zaak
 * many-to-many navigation property.  Each word must match at least one of
 * Onderwerp or Titel inside the related Zaak collection.
 */
function buildZaakTextFilter(query: string): string {
  const words = query
    .replace(/["']/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/'/g, "''"))

  if (words.length === 0) return ""

  // Each word: Zaak/any(z: contains(z/Onderwerp,'word') or contains(z/Titel,'word'))
  return words
    .map(
      (w) =>
        `Zaak/any(z:contains(z/Onderwerp,'${w}') or contains(z/Titel,'${w}'))`,
    )
    .join(" and ")
}

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
    // Direct lookup by zaakId — use Zaak/any() lambda since Besluit↔Zaak is many-to-many
    if (zaakId) {
      const besluiten = await queryTK("Besluit", {
        $filter: `Zaak/any(z:z/Id eq ${zaakId}) and StemmingsSoort ne null and Verwijderd eq false`,
        $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
        $expand:
          "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte),Zaak($select=Id,Onderwerp,Titel,Nummer,Soort,GestartOp)",
        $orderby: "GewijzigdOp desc",
      })

      return {
        count: besluiten.length,
        results: besluiten.map(formatBesluitWithZaak),
      }
    }

    // Search by query — single query using Zaak/any() lambda filter on Besluit
    if (!query) {
      return { count: 0, results: [], error: "Geef een 'query' of 'zaakId' op." }
    }

    const zaakFilter = buildZaakTextFilter(query)
    if (!zaakFilter) {
      return { count: 0, results: [] }
    }

    const besluiten = await queryTK("Besluit", {
      $filter: `${zaakFilter} and StemmingsSoort ne null and Verwijderd eq false`,
      $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
      $expand:
        "Stemming($select=Soort,ActorNaam,ActorFractie,FractieGrootte),Zaak($select=Id,Onderwerp,Titel,Nummer,Soort,GestartOp)",
      $orderby: "GewijzigdOp desc",
      $top: String(maxResults),
    })

    return {
      count: besluiten.length,
      results: besluiten.map(formatBesluitWithZaak),
    }
  },
})

function formatBesluitWithZaak(b: Record<string, unknown>) {
  const zaken = b.Zaak as Array<Record<string, unknown>> | undefined
  const zaak = zaken?.[0]
  return {
    besluit: b.BesluitTekst,
    besluitSoort: b.BesluitSoort,
    soort: b.StemmingsSoort,
    zaak: zaak
      ? {
          nummer: zaak.Nummer,
          type: zaak.Soort,
          onderwerp: zaak.Onderwerp || zaak.Titel,
          datum: zaak.GestartOp,
        }
      : undefined,
    stemmingen: (
      (b.Stemming as Array<Record<string, unknown>>) ?? []
    ).map((s) => ({
      fractie: s.ActorFractie || s.ActorNaam,
      stem: s.Soort,
      zetels: s.FractieGrootte,
    })),
  }
}
