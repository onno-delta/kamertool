import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user.organisationId !== id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email } = await req.json()
  const user = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await db.update(users).set({ organisationId: id }).where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}
