import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const days = Math.min(Number(url.searchParams.get("days") ?? 14), 90)
    const type = url.searchParams.get("type") ?? ""
    const query = url.searchParams.get("q") ?? ""

    const now = new Date()
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const fromStr = now.toISOString().split("T")[0] + "T00:00:00Z"
    const untilStr = until.toISOString().split("T")[0] + "T23:59:59Z"

    let filter = `Datum ge ${fromStr} and Datum le ${untilStr} and Verwijderd eq false and Status ne 'Geannuleerd' and Status ne 'Verplaatst'`

    if (type === "plenair") {
      filter += ` and (Soort eq 'Plenair debat' or Soort eq 'Tweeminutendebat' or Soort eq 'Stemmingen' or Soort eq 'Regeling van werkzaamheden')`
    } else if (type === "commissie") {
      filter += ` and (Soort eq 'Commissiedebat' or Soort eq 'Wetgevingsoverleg' or Soort eq 'Notaoverleg' or Soort eq 'Begrotingsoverleg' or Soort eq 'Rondetafelgesprek')`
    } else if (type === "overig") {
      filter += ` and Soort ne 'Plenair debat' and Soort ne 'Tweeminutendebat' and Soort ne 'Stemmingen' and Soort ne 'Regeling van werkzaamheden' and Soort ne 'Commissiedebat' and Soort ne 'Wetgevingsoverleg' and Soort ne 'Notaoverleg' and Soort ne 'Begrotingsoverleg' and Soort ne 'Rondetafelgesprek'`
    }
    // else: no type filter = show all

    if (query) {
      filter += ` and (contains(Onderwerp,'${query}') or contains(Voortouwnaam,'${query}'))`
    }

    console.log("[agenda] GET", { days, type, query })

    const results = await queryTK("Activiteit", {
      $filter: filter,
      $select: "Id,Soort,Nummer,Onderwerp,Datum,Aanvangstijd,Eindtijd,Status,Voortouwnaam,Voortouwafkorting",
      $orderby: "Datum asc",
      $top: "100",
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
