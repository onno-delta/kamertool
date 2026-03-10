import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, userDossiers, userKamerleden, userMeetingSkills, userSources, userHiddenSources } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const [user] = await db
      .select({ defaultPartyId: users.defaultPartyId, searchBeyondSources: users.searchBeyondSources })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const dossiers = await db
      .select({ dossier: userDossiers.dossier })
      .from(userDossiers)
      .where(eq(userDossiers.userId, session.user.id))

    const kamerleden = await db
      .select({ persoonId: userKamerleden.persoonId, naam: userKamerleden.naam, fractie: userKamerleden.fractie })
      .from(userKamerleden)
      .where(eq(userKamerleden.userId, session.user.id))

    const meetingSkills = await db
      .select({ soort: userMeetingSkills.soort, prompt: userMeetingSkills.prompt })
      .from(userMeetingSkills)
      .where(eq(userMeetingSkills.userId, session.user.id))

    const sources = await db
      .select({ id: userSources.id, url: userSources.url, title: userSources.title })
      .from(userSources)
      .where(eq(userSources.userId, session.user.id))

    const hiddenSources = await db
      .select({ sourceName: userHiddenSources.sourceName })
      .from(userHiddenSources)
      .where(eq(userHiddenSources.userId, session.user.id))

    return NextResponse.json({
      defaultPartyId: user?.defaultPartyId ?? null,
      searchBeyondSources: user?.searchBeyondSources ?? true,
      dossiers: dossiers.map((d) => d.dossier),
      kamerleden: kamerleden.map((k) => ({ id: k.persoonId, naam: k.naam, fractie: k.fractie })),
      meetingSkills: meetingSkills.reduce((acc, s) => ({ ...acc, [s.soort]: s.prompt }), {} as Record<string, string>),
      sources: sources.map((s) => ({ id: s.id, url: s.url, title: s.title })),
      hiddenSources: hiddenSources.map((h) => h.sourceName),
    })
  } catch (error) {
    console.error("[settings/preferences] GET ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { defaultPartyId, dossiers, kamerleden, meetingSkills, sources, searchBeyondSources, hiddenSources } = await req.json()


    // Update default party + search beyond sources
    await db
      .update(users)
      .set({
        defaultPartyId: defaultPartyId || null,
        searchBeyondSources: searchBeyondSources ?? true,
      })
      .where(eq(users.id, session.user.id))

    // Replace dossiers
    await db
      .delete(userDossiers)
      .where(eq(userDossiers.userId, session.user.id))

    if (Array.isArray(dossiers) && dossiers.length > 0) {
      await db.insert(userDossiers).values(
        dossiers.map((d: string) => ({
          userId: session.user.id,
          dossier: d,
        }))
      )
    }

    // Replace kamerleden
    await db
      .delete(userKamerleden)
      .where(eq(userKamerleden.userId, session.user.id))

    if (Array.isArray(kamerleden) && kamerleden.length > 0) {
      await db.insert(userKamerleden).values(
        kamerleden.map((k: { id: string; naam: string; fractie?: string }) => ({
          userId: session.user.id,
          persoonId: k.id,
          naam: k.naam,
          fractie: k.fractie ?? null,
        }))
      )
    }

    // Replace meeting skills
    if (meetingSkills && typeof meetingSkills === "object") {
      await db
        .delete(userMeetingSkills)
        .where(eq(userMeetingSkills.userId, session.user.id))

      const entries = Object.entries(meetingSkills as Record<string, string>).filter(
        ([, prompt]) => prompt.trim().length > 0
      )
      if (entries.length > 0) {
        await db.insert(userMeetingSkills).values(
          entries.map(([soort, prompt]) => ({
            userId: session.user.id,
            soort,
            prompt,
          }))
        )
      }
    }

    // Replace sources
    if (Array.isArray(sources)) {
      await db
        .delete(userSources)
        .where(eq(userSources.userId, session.user.id))

      if (sources.length > 0) {
        await db.insert(userSources).values(
          sources.map((s: { url: string; title?: string }) => ({
            userId: session.user.id,
            url: s.url,
            title: s.title ?? null,
          }))
        )
      }
    }

    // Replace hidden sources
    if (Array.isArray(hiddenSources)) {
      await db
        .delete(userHiddenSources)
        .where(eq(userHiddenSources.userId, session.user.id))

      if (hiddenSources.length > 0) {
        await db.insert(userHiddenSources).values(
          hiddenSources.map((name: string) => ({
            userId: session.user.id,
            sourceName: name,
          }))
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[settings/preferences] PUT ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
