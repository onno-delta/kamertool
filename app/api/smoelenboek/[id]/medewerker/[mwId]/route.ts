import { auth } from "@/auth"
import { db } from "@/lib/db"
import { smoelenboekMedewerkers } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mwId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mwId } = await params

    const [existing] = await db
      .select()
      .from(smoelenboekMedewerkers)
      .where(eq(smoelenboekMedewerkers.id, mwId))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 })
    }

    if (existing.submittedBy !== session.user.id) {
      return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 })
    }

    await db
      .delete(smoelenboekMedewerkers)
      .where(
        and(
          eq(smoelenboekMedewerkers.id, mwId),
          eq(smoelenboekMedewerkers.submittedBy, session.user.id)
        )
      )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[smoelenboek/medewerker/delete] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
