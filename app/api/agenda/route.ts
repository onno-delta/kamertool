import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"
import { safeErrorResponse } from "@/lib/errors"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const now = new Date()
    const fromParam = url.searchParams.get("from")
    const toParam = url.searchParams.get("to")

    // If requesting max date, return the latest available activity date
    if (url.searchParams.get("maxDate") === "1") {
      const latest = await queryTK("Activiteit", {
        $filter: "Verwijderd eq false and Status ne 'Geannuleerd' and Status ne 'Verplaatst'",
        $select: "Datum",
        $orderby: "Datum desc",
        $top: "1",
      })
      const maxDate = latest[0]?.Datum?.split("T")[0] ?? null
      return NextResponse.json({ maxDate })
    }

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
    return safeErrorResponse(error)
  }
}
