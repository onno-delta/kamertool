import { auth } from "@/auth"
import { db } from "@/lib/db"
import { orgDocuments } from "@/lib/db/schema"
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

  const docs = await db
    .select({ id: orgDocuments.id, title: orgDocuments.title, createdAt: orgDocuments.createdAt })
    .from(orgDocuments)
    .where(eq(orgDocuments.organisationId, id))

  return NextResponse.json(docs)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session || session.user.organisationId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content } = await req.json()

  const doc = await db.insert(orgDocuments).values({
    organisationId: id,
    title,
    content,
  }).returning()

  return NextResponse.json(doc[0])
}
