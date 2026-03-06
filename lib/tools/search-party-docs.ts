import { tool } from "ai"
import { z } from "zod"
import { db } from "@/lib/db"
import { parties, orgDocuments } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

export function createSearchPartyDocs(
  partyId: string | null,
  organisationId: string | null
) {
  return tool({
    description:
      "Zoek in partijprogramma's en organisatiedocumenten. Vindt standpunten en beleidsstukken van de geselecteerde partij.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Zoekterm voor in partijdocumenten en programma's"),
    }),
    execute: async ({ query }) => {
      const results: Array<{
        source: string
        title: string
        excerpt: string
      }> = []

      // Search party programme
      if (partyId) {
        const partyResults = await db
          .select()
          .from(parties)
          .where(
            and(
              eq(parties.id, partyId),
              sql`${parties.programme} ILIKE ${"%" + query + "%"}`
            )
          )
          .limit(1)

        if (partyResults.length > 0) {
          const party = partyResults[0]
          const idx = party.programme
            .toLowerCase()
            .indexOf(query.toLowerCase())
          const start = Math.max(0, idx - 500)
          const end = Math.min(party.programme.length, idx + 500)
          results.push({
            source: `Verkiezingsprogramma ${party.shortName}`,
            title: party.name,
            excerpt: party.programme.slice(start, end),
          })
        }
      }

      // Search org documents
      if (organisationId) {
        const docs = await db
          .select()
          .from(orgDocuments)
          .where(
            and(
              eq(orgDocuments.organisationId, organisationId),
              sql`${orgDocuments.content} ILIKE ${"%" + query + "%"}`
            )
          )
          .limit(5)

        for (const doc of docs) {
          const idx = doc.content.toLowerCase().indexOf(query.toLowerCase())
          const start = Math.max(0, idx - 250)
          const end = Math.min(doc.content.length, idx + 250)
          results.push({
            source: "Organisatiedocument",
            title: doc.title,
            excerpt: doc.content.slice(start, end),
          })
        }
      }

      return { count: results.length, results }
    },
  })
}
