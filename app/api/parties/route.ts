import { db } from "@/lib/db"
import { parties } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  const allParties = await db
    .select({
      id: parties.id,
      name: parties.name,
      shortName: parties.shortName,
    })
    .from(parties)
    .orderBy(parties.shortName)

  return NextResponse.json(allParties)
}
