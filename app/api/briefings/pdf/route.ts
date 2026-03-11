import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { createBriefingBlob } from "@/lib/pdf-template"
import { sanitizeFilename } from "@/lib/sanitize"
import { safeErrorResponse } from "@/lib/errors"

const bodySchema = z.object({
  content: z.string().max(500_000),
  topic: z.string().max(1000),
  partyName: z.string().optional(),
}).passthrough()

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { content, topic, partyName } = parsed.data

    const blob = await createBriefingBlob(content, topic, { partyName })
    const buffer = Buffer.from(await blob.arrayBuffer())

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(topic)}.pdf"`,
      },
    })
  } catch (error) {
    return safeErrorResponse(error)
  }
}
