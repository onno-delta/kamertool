import { auth } from "@/auth"
import { db } from "@/lib/db"
import { smoelenboekContacts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contactId } = await params

    const [existing] = await db
      .select()
      .from(smoelenboekContacts)
      .where(eq(smoelenboekContacts.id, contactId))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 })
    }

    if (existing.submittedBy !== session.user.id) {
      return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 })
    }

    await db
      .delete(smoelenboekContacts)
      .where(
        and(
          eq(smoelenboekContacts.id, contactId),
          eq(smoelenboekContacts.submittedBy, session.user.id)
        )
      )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[smoelenboek/contact/delete] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
