import { auth } from "@/auth"
import { db } from "@/lib/db"
import { orgDocuments } from "@/lib/db/schema"
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
    console.log("[org/documents] GET", { orgId: id })

    const docs = await db
      .select({ id: orgDocuments.id, title: orgDocuments.title, createdAt: orgDocuments.createdAt })
      .from(orgDocuments)
      .where(eq(orgDocuments.organisationId, id))

    return NextResponse.json(docs)
  } catch (error) {
    console.error("[org/documents] GET ERROR:", error)
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

    if (!session || session.user.organisationId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content } = await req.json()
    console.log("[org/documents] POST", { orgId: id, title })

    const doc = await db.insert(orgDocuments).values({
      organisationId: id,
      title,
      content,
    }).returning()

    return NextResponse.json(doc[0])
  } catch (error) {
    console.error("[org/documents] POST ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
