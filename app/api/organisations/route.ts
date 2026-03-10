import { auth } from "@/auth"
import { db } from "@/lib/db"
import { organisations, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { organisationSchema } from "@/lib/validation"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = organisationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 })
    }
    const { name, slug } = parsed.data


    const org = await db.insert(organisations).values({
      name,
      slug,
      createdBy: session.user.id,
    }).returning()

    await db.update(users).set({
      organisationId: org[0].id,
      role: "admin",
    }).where(eq(users.id, session.user.id))

    return NextResponse.json(org[0])
  } catch (error) {
    console.error("[organisations] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
