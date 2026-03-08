import { NextResponse } from "next/server"
import { queryTKSingle } from "@/lib/tk-api"
import { getCommissionMap } from "@/lib/tk-commissions"
import { getCurrentMembers } from "@/lib/tk-members"
import { KABINET } from "@/data/kabinet"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Check if it's a cabinet member (id starts with "kabinet-")
    if (id.startsWith("kabinet-")) {
      const slug = id.replace("kabinet-", "")
      const lid = KABINET.find(
        (k) =>
          k.naam
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") === slug
      )
      if (!lid) {
        return NextResponse.json({ error: "Niet gevonden" }, { status: 404 })
      }
      return NextResponse.json({
        id,
        naam: lid.naam,
        fractie: lid.partij,
        rol: lid.rol,
        portefeuille: lid.portefeuille,
        isKabinet: true,
      })
    }

    // Kamerlid — fetch from TK API
    const persoon = await queryTKSingle(`Persoon(${id})`, {
      $select: "Id,Roepnaam,Tussenvoegsel,Achternaam,Geboortedatum,Geslacht",
    })

    if (!persoon?.Id) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 })
    }

    const naam = [persoon.Roepnaam, persoon.Tussenvoegsel, persoon.Achternaam]
      .filter(Boolean)
      .join(" ")

    // Get their fractie and commissions
    const [members, commissionMap] = await Promise.all([
      getCurrentMembers(),
      getCommissionMap(),
    ])
    const member = members.find((m) => m.id === id)
    const fractie = member?.fractie ?? undefined
    const commissies = commissionMap.get(id) ?? []

    return NextResponse.json({
      id: persoon.Id,
      naam,
      fractie,
      roepnaam: persoon.Roepnaam,
      achternaam: persoon.Achternaam,
      geboortedatum: persoon.Geboortedatum,
      commissies,
      rol: "Kamerlid",
      isKabinet: false,
    })
  } catch (error) {
    console.error("[smoelenboek/id] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
