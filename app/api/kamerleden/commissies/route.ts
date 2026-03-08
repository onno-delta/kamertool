import { getCommissionMap } from "@/lib/tk-commissions"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get("ids")
    if (!idsParam) return NextResponse.json({ commissies: [] })

    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    const map = await getCommissionMap()

    const all = new Set<string>()
    for (const id of ids) {
      for (const afk of map.get(id) ?? []) all.add(afk)
    }

    return NextResponse.json({ commissies: [...all] })
  } catch (error) {
    console.error("[kamerleden/commissies] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
