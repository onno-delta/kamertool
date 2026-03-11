import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
import { PARTY_SORT_ORDER } from "@/lib/parties"
import { NextResponse } from "next/server"
import { safeErrorResponse } from "@/lib/errors"

type CachedParty = { id: string; name: string; shortName: string }
let cachedParties: CachedParty[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600_000 // 1 hour

export async function GET() {
  try {
    if (cachedParties && Date.now() - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedParties)
    }

    console.log("[parties] GET (cache miss)")
    const allParties = await db
      .select({
        id: parties.id,
        name: parties.name,
        shortName: parties.shortName,
      })
      .from(parties)

    // Sort by seat count (PARTY_SORT_ORDER), unknowns at the end
    allParties.sort((a, b) => {
      const orderA = PARTY_SORT_ORDER[a.shortName] ?? 999
      const orderB = PARTY_SORT_ORDER[b.shortName] ?? 999
      return orderA - orderB
    })

    cachedParties = allParties
    cacheTime = Date.now()

    console.log("[parties] returning", allParties.length, "parties")
    return NextResponse.json(allParties)
  } catch (error) {
    console.error("[parties] ERROR:", error)
    return safeErrorResponse(error)
  }
}
