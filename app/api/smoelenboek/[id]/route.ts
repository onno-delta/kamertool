import { NextResponse } from "next/server"
import { queryTKSingle } from "@/lib/tk-api"
import { getCommissionMap } from "@/lib/tk-commissions"
import { getCurrentMembers } from "@/lib/tk-members"
import { KABINET } from "@/data/kabinet"
import { db } from "@/lib/db"
import {
  smoelenboekProfiles,
  smoelenboekContacts,
  smoelenboekMedewerkers,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { findProfileUrl, scrapeKamerlidProfile } from "@/lib/tk-scraper"

function tkFotoUrl(
  personId: string,
  size: "thumbnail" | "medium" = "medium"
): string {
  return `https://www.tweedekamer.nl/sites/default/files/styles/${size}/public/tk_external_data_ggm_sync/photos/${personId}.jpg`
}

const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

async function getOrScrapeProfile(personId: string, naam: string) {
  // Check cache
  const [cached] = await db
    .select()
    .from(smoelenboekProfiles)
    .where(eq(smoelenboekProfiles.personId, personId))
    .limit(1)

  if (cached && Date.now() - cached.scrapedAt.getTime() < CACHE_MAX_AGE_MS) {
    return cached
  }

  // Scrape
  try {
    const profileUrl = await findProfileUrl(naam)
    if (!profileUrl) return cached ?? null

    const { email, bio } = await scrapeKamerlidProfile(profileUrl)

    const values = {
      personId,
      email,
      bio,
      tweedekamerUrl: profileUrl,
      scrapedAt: new Date(),
    }

    await db
      .insert(smoelenboekProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: smoelenboekProfiles.personId,
        set: { email, bio, tweedekamerUrl: profileUrl, scrapedAt: new Date() },
      })

    return values
  } catch (e) {
    console.error("[smoelenboek/id] Scrape error:", e)
    return cached ?? null
  }
}

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

      const [contacten, medewerkers] = await Promise.all([
        db
          .select()
          .from(smoelenboekContacts)
          .where(eq(smoelenboekContacts.personId, id)),
        db
          .select()
          .from(smoelenboekMedewerkers)
          .where(eq(smoelenboekMedewerkers.personId, id)),
      ])

      return NextResponse.json({
        id,
        naam: lid.naam,
        fractie: lid.partij,
        rol: lid.rol,
        portefeuille: lid.portefeuille,
        fotoUrl: lid.fotoUrl,
        isKabinet: true,
        contacten,
        medewerkers,
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

    // Get their fractie, commissions, profile data, contacts, and medewerkers
    const [members, commissionMap, profile, contacten, medewerkers] =
      await Promise.all([
        getCurrentMembers(),
        getCommissionMap(),
        getOrScrapeProfile(id, naam),
        db
          .select()
          .from(smoelenboekContacts)
          .where(eq(smoelenboekContacts.personId, id)),
        db
          .select()
          .from(smoelenboekMedewerkers)
          .where(eq(smoelenboekMedewerkers.personId, id)),
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
      fotoUrl: tkFotoUrl(id),
      email: profile?.email ?? null,
      bio: profile?.bio ?? null,
      tweedekamerUrl: profile?.tweedekamerUrl ?? null,
      contacten,
      medewerkers,
    })
  } catch (error) {
    console.error("[smoelenboek/id] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
