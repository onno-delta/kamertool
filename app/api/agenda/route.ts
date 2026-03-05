import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const days = Math.min(Number(url.searchParams.get("days") ?? 14), 90)

    const now = new Date()
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const fromStr = now.toISOString().split("T")[0] + "T00:00:00Z"
    const untilStr = until.toISOString().split("T")[0] + "T23:59:59Z"

    const filter = `Datum ge ${fromStr} and Datum le ${untilStr} and Verwijderd eq false and Status ne 'Geannuleerd' and Status ne 'Verplaatst'`

    console.log("[agenda] GET", { days })

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
