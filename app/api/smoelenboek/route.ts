import { NextResponse } from "next/server"
import { getCurrentMembers } from "@/lib/tk-members"
import { KABINET } from "@/data/kabinet"

function tkFotoUrl(personId: string, size: "thumbnail" | "medium" = "thumbnail"): string {
  return `https://www.tweedekamer.nl/sites/default/files/styles/${size}/public/tk_external_data_ggm_sync/photos/${personId}.jpg`
}

export type SmoelenboekEntry = {
  id: string
  naam: string
  fractie: string
  rol: "Kamerlid" | "Minister" | "Staatssecretaris"
  portefeuille?: string
  fotoUrl?: string
}

export async function GET() {
  try {
    const members = await getCurrentMembers()

    // Build set of cabinet member names for deduplication
    const kabinetNamen = new Set(KABINET.map((k) => k.naam))

    const kamerleden: SmoelenboekEntry[] = members
      .filter((m) => !kabinetNamen.has(m.naam))
      .map((m) => ({
        id: m.id,
        naam: m.naam,
        fractie: m.fractie,
        rol: "Kamerlid" as const,
        fotoUrl: tkFotoUrl(m.id),
      }))

    const kabinet: SmoelenboekEntry[] = KABINET.map((k) => ({
      id: `kabinet-${k.naam.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
      naam: k.naam,
      fractie: k.partij,
      rol: k.rol,
      portefeuille: k.portefeuille,
      fotoUrl: k.fotoUrl,
    }))

    const all = [...kamerleden, ...kabinet].sort((a, b) =>
      a.naam.localeCompare(b.naam, "nl")
    )

    return NextResponse.json(all)
  } catch (error) {
    console.error("[smoelenboek] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
