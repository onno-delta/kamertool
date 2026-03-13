import { NextResponse } from "next/server"
import { getCurrentMembers } from "@/lib/tk-members"
import { getCommissionMap } from "@/lib/tk-commissions"
import { KABINET } from "@/data/kabinet"
import { safeErrorResponse } from "@/lib/errors"
import { db } from "@/lib/db"
import { smoelenboekProfiles } from "@/lib/db/schema"
import { inArray } from "drizzle-orm"

function tkFotoUrl(personId: string, size: "thumbnail" | "medium" = "thumbnail"): string {
  return `https://www.tweedekamer.nl/sites/default/files/styles/${size}/public/tk_external_data_ggm_sync/photos/${personId}.jpg`
}

export type ColofonEntry = {
  id: string
  naam: string
  fractie: string
  rol: "Kamerlid" | "Minister" | "Staatssecretaris"
  portefeuille?: string
  fotoUrl?: string
  commissies?: string[]
  tags?: string[]
  partyWebsiteUrl?: string
}

export async function GET() {
  try {
    const [members, commissionMap] = await Promise.all([
      getCurrentMembers(),
      getCommissionMap({ vastOnly: true }),
    ])

    // Build set of cabinet member names for deduplication
    const kabinetNamen = new Set(KABINET.map((k) => k.naam))

    const kamerledenRaw = members.filter((m) => !kabinetNamen.has(m.naam))

    // Batch-query profiles for tags
    const personIds = kamerledenRaw.map((m) => m.id)
    const profiles =
      personIds.length > 0
        ? await db
            .select({
              personId: smoelenboekProfiles.personId,
              tags: smoelenboekProfiles.tags,
              partyWebsiteUrl: smoelenboekProfiles.partyWebsiteUrl,
            })
            .from(smoelenboekProfiles)
            .where(inArray(smoelenboekProfiles.personId, personIds))
        : []

    const profileMap = new Map(profiles.map((p) => [p.personId, p]))

    const kamerleden: ColofonEntry[] = kamerledenRaw.map((m) => {
      const profile = profileMap.get(m.id)
      const tags = profile?.tags ? (JSON.parse(profile.tags) as string[]) : undefined
      return {
        id: m.id,
        naam: m.naam,
        fractie: m.fractie,
        rol: "Kamerlid" as const,
        fotoUrl: tkFotoUrl(m.id),
        commissies: commissionMap.get(m.id) ?? [],
        ...(tags && tags.length > 0 ? { tags } : {}),
        ...(profile?.partyWebsiteUrl ? { partyWebsiteUrl: profile.partyWebsiteUrl } : {}),
      }
    })

    const kabinet: ColofonEntry[] = KABINET.map((k) => ({
      id: `kabinet-${k.naam.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
      naam: k.naam,
      fractie: k.partij,
      rol: k.rol,
      portefeuille: k.portefeuille,
      fotoUrl: k.fotoUrl,
    }))

    const all = [...kamerleden, ...kabinet].sort((a, b) =>
      a.naam.localeCompare(b.naam, "nl")
    )

    return NextResponse.json(all)
  } catch (error) {
    console.error("[smoelenboek] ERROR:", error)
    return safeErrorResponse(error)
  }
}
