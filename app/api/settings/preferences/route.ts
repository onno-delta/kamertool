import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, userDossiers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[settings/preferences] GET", { userId: session.user.id })

    const [user] = await db
      .select({ defaultPartyId: users.defaultPartyId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const dossiers = await db
      .select({ dossier: userDossiers.dossier })
      .from(userDossiers)
      .where(eq(userDossiers.userId, session.user.id))

    return NextResponse.json({
      defaultPartyId: user?.defaultPartyId ?? null,
      dossiers: dossiers.map((d) => d.dossier),
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

    const { defaultPartyId, dossiers } = await req.json()
    console.log("[settings/preferences] PUT", { userId: session.user.id, defaultPartyId, dossiers })

    // Update default party
    await db
      .update(users)
      .set({ defaultPartyId: defaultPartyId || null })
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

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[settings/preferences] PUT ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
