import { queryTK } from "@/lib/tk-api"

export type TKMember = {
  id: string
  naam: string
  fractie: string
  achternaam: string
  tussenvoegsel: string | null
}

// In-memory cache for current TK members (refreshes every hour)
let cachedMembers: TKMember[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600_000

export async function getCurrentMembers(): Promise<TKMember[]> {
  if (cachedMembers && Date.now() - cacheTime < CACHE_TTL) {
    return cachedMembers
  }

  // Get all active fractie seat records — these are current TK members
  const records = await queryTK("FractieZetelPersoon", {
    $filter: "TotEnMet eq null",
    $expand:
      "Persoon($select=Id,Roepnaam,Tussenvoegsel,Achternaam),FractieZetel($expand=Fractie($select=NaamNL,Afkorting))",
    $top: "200",
  })

  const members: TKMember[] = records
    .filter((r: Record<string, unknown>) => r.Persoon)
    .map((r: Record<string, unknown>) => {
      const p = r.Persoon as Record<string, string>
      const fz = r.FractieZetel as Record<string, unknown> | undefined
      const f = fz?.Fractie as Record<string, string> | undefined
      const fractie = f?.Afkorting || f?.NaamNL || ""
      const naam = [p.Roepnaam, p.Tussenvoegsel, p.Achternaam]
        .filter(Boolean)
        .join(" ")
      return {
        id: p.Id,
        naam,
        fractie,
        achternaam: p.Achternaam || "",
        tussenvoegsel: p.Tussenvoegsel || null,
      }
    })
    .sort((a: TKMember, b: TKMember) => a.naam.localeCompare(b.naam, "nl"))

  cachedMembers = members
  cacheTime = Date.now()
  return members
}
