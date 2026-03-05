import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const now = new Date()
    const fromParam = url.searchParams.get("from")
    const toParam = url.searchParams.get("to")

    const fromStr = (fromParam || now.toISOString().split("T")[0]) + "T00:00:00Z"
    const toStr = (toParam || new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0]) + "T23:59:59Z"

    const filter = `Datum ge ${fromStr} and Datum le ${toStr} and Verwijderd eq false and Status ne 'Geannuleerd' and Status ne 'Verplaatst'`

    console.log("[agenda] GET", { from: fromStr, to: toStr })

    const results = await queryTK("Activiteit", {
      $filter: filter,
      $select: "Id,Soort,Nummer,Onderwerp,Datum,Aanvangstijd,Eindtijd,Status,Voortouwnaam,Voortouwafkorting",
      $orderby: "Datum asc",
      $top: "200",
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("[agenda] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
