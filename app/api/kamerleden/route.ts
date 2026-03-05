import { queryTK } from "@/lib/tk-api"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    // Search current Tweede Kamer members via the Persoon entity
    // Filter: active members (no removal date) with name matching search
    const results = await queryTK("Persoon", {
      $filter: `contains(Roepnaam,'${q}') or contains(Achternaam,'${q}') or contains(Initialen,'${q}')`,
      $select: "Id,Roepnaam,Tussenvoegsel,Achternaam,Functie",
      $orderby: "Achternaam asc",
      $top: "20",
    })

    // Get fractie membership for these persons
    const persoonIds = results.map((p: Record<string, string>) => p.Id)
    const formatted = []

    for (const p of results) {
      let fractie = ""
      try {
        const lidmaatschap = await queryTK("FractieZetelPersoon", {
          $filter: `Persoon_Id eq ${p.Id} and TotEnMet eq null`,
          $expand: "FractieZetel($expand=Fractie($select=NaamNL,Afkorting))",
          $select: "Id",
          $top: "1",
        })
        if (lidmaatschap[0]?.FractieZetel?.Fractie) {
          fractie = lidmaatschap[0].FractieZetel.Fractie.Afkorting || lidmaatschap[0].FractieZetel.Fractie.NaamNL || ""
        }
      } catch {
        // fractie lookup failed, skip
      }

      const naam = [p.Roepnaam, p.Tussenvoegsel, p.Achternaam].filter(Boolean).join(" ")
      formatted.push({
        id: p.Id,
        naam,
        fractie,
      })
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("[kamerleden] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
