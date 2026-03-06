import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
import { PARTY_SORT_ORDER } from "@/lib/parties"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[parties] GET")
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

    console.log("[parties] returning", allParties.length, "parties")
    return NextResponse.json(allParties)
  } catch (error) {
    console.error("[parties] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
