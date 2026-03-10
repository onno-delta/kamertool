import { auth } from "@/auth"
import { db } from "@/lib/db"
import { orgDocuments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { parseDocument, isSupportedType, getSupportedExtensions } from "@/lib/parse-document"

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

    const contentType = req.headers.get("content-type") ?? ""

    let title: string
    let content: string

    if (contentType.includes("multipart/form-data")) {
      // File upload
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      title = (formData.get("title") as string) ?? ""

      if (!file) {
        return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 })
      }

      if (!isSupportedType(file.type)) {
        return NextResponse.json(
          { error: `Bestandstype niet ondersteund. Ondersteund: ${getSupportedExtensions()}` },
          { status: 400 }
        )
      }

      // Use filename as title if none provided
      if (!title) {
        title = file.name.replace(/\.[^.]+$/, "")
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await parseDocument(buffer, file.type, file.name)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      content = result.text
    } else {
      // JSON body (existing flow)
      const body = await req.json()
      title = body.title
      content = body.content
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Titel en inhoud zijn verplicht" }, { status: 400 })
    }

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
