import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"

type Member = { id: string; naam: string; fractie: string }

// In-memory cache for current TK members (refreshes every hour)
let cachedMembers: Member[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600_000

async function getCurrentMembers(): Promise<Member[]> {
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

  const members: Member[] = records
    .filter((r: Record<string, unknown>) => r.Persoon)
    .map((r: Record<string, unknown>) => {
      const p = r.Persoon as Record<string, string>
      const fz = r.FractieZetel as Record<string, unknown> | undefined
      const f = fz?.Fractie as Record<string, string> | undefined
      const fractie = f?.Afkorting || f?.NaamNL || ""
      const naam = [p.Roepnaam, p.Tussenvoegsel, p.Achternaam]
        .filter(Boolean)
        .join(" ")
      return { id: p.Id, naam, fractie }
    })
    .sort((a: Member, b: Member) => a.naam.localeCompare(b.naam, "nl"))

  cachedMembers = members
  cacheTime = Date.now()
  return members
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.trim().toLowerCase()

    const members = await getCurrentMembers()

    if (!q || q.length < 2) {
      return NextResponse.json(members)
    }

    const filtered = members.filter((m) => m.naam.toLowerCase().includes(q))
    return NextResponse.json(filtered)
  } catch (error) {
    console.error("[kamerleden] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
