import { getCurrentMembers } from "@/lib/tk-members"
import { NextResponse } from "next/server"
import { safeErrorResponse } from "@/lib/errors"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.trim().toLowerCase()

    const members = await getCurrentMembers()
    const simplified = members.map(({ id, naam, fractie }) => ({
      id,
      naam,
      fractie,
    }))

    if (!q || q.length < 2) {
      return NextResponse.json(simplified)
    }

    const filtered = simplified.filter((m) =>
      m.naam.toLowerCase().includes(q)
    )
    return NextResponse.json(filtered)
  } catch (error) {
    console.error("[kamerleden] ERROR:", error)
    return safeErrorResponse(error)
  }
}
