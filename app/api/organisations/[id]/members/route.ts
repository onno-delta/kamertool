import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { safeErrorResponse } from "@/lib/errors"

const inviteSchema = z.object({
  email: z.string().email().max(200),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session || session.user.organisationId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const members = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.organisationId, id))

    return NextResponse.json(members)
  } catch (error) {
    console.error("[org/members] GET ERROR:", error)
    return safeErrorResponse(error)
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session || session.user.organisationId !== id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 })
    }

    console.log("[org/members] POST", { orgId: id })
    const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check if user is already in another organisation
    if (user.organisationId && user.organisationId !== id) {
      return NextResponse.json(
        { error: "Gebruiker is al lid van een andere organisatie" },
        { status: 409 }
      )
    }

    await db.update(users).set({ organisationId: id }).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[org/members] POST ERROR:", error)
    return safeErrorResponse(error)
  }
}
