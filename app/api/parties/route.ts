import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
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
      .orderBy(parties.shortName)

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
