import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

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
    console.log("[org/members] GET", { orgId: id, userId: session.user.id })

    const members = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.organisationId, id))

    return NextResponse.json(members)
  } catch (error) {
    console.error("[org/members] GET ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
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

    const { email } = await req.json()
    console.log("[org/members] POST", { orgId: id, email })
    const user = await db.query.users.findFirst({ where: eq(users.email, email) })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await db.update(users).set({ organisationId: id }).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[org/members] POST ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
