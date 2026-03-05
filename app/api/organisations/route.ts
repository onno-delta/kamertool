import { auth } from "@/auth"
import { db } from "@/lib/db"
import { organisations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, slug } = await req.json()
    console.log("[organisations] POST", { userId: session.user.id, name, slug })

    const org = await db.insert(organisations).values({
      name,
      slug,
      createdBy: session.user.id,
    }).returning()

    await db.update(users).set({
      organisationId: org[0].id,
      role: "admin",
    }).where(eq(users.id, session.user.id))

    console.log("[organisations] created", org[0].id)
    return NextResponse.json(org[0])
  } catch (error) {
    console.error("[organisations] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
