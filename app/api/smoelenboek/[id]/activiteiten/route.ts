import { NextResponse } from "next/server"
import {
  getPersonDocuments,
  getFractieStemmingen,
  getPersonToezeggingen,
  getPersonAgenda,
  getPersonHandelingen,
} from "@/lib/tk-person"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(req.url)
  const type = url.searchParams.get("type")
  const fractie = url.searchParams.get("fractie") ?? ""
  const naam = url.searchParams.get("naam") ?? ""
  const commissies = url.searchParams.get("commissies")?.split(",").filter(Boolean) ?? []

  try {
    switch (type) {
      case "documenten": {
        if (id.startsWith("kabinet-")) {
          return NextResponse.json([])
        }
        const docs = await getPersonDocuments(id)
        return NextResponse.json(docs)
      }
      case "stemmingen": {
        if (!fractie) return NextResponse.json([])
        const stemmingen = await getFractieStemmingen(fractie)
        return NextResponse.json(stemmingen)
      }
      case "toezeggingen": {
        if (!naam) return NextResponse.json([])
        const toezeggingen = await getPersonToezeggingen(naam)
        return NextResponse.json(toezeggingen)
      }
      case "agenda": {
        if (commissies.length === 0) return NextResponse.json([])
        const agenda = await getPersonAgenda(commissies)
        return NextResponse.json(agenda)
      }
      case "handelingen": {
        if (!naam) return NextResponse.json([])
        // Use last name for more precise matching
        const parts = naam.split(" ")
        const achternaam = parts[parts.length - 1]
        const handelingen = await getPersonHandelingen(achternaam)
        return NextResponse.json(handelingen)
      }
      default:
        return NextResponse.json(
          { error: "Ongeldig type. Gebruik: documenten, stemmingen, toezeggingen, agenda" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error(`[smoelenboek/activiteiten] ERROR (${type}):`, error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
