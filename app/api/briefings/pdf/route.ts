import { NextResponse } from "next/server"
import { createBriefingBlob } from "@/lib/pdf-template"

export async function POST(req: Request) {
  try {
    const { content, topic, partyName } = await req.json()

    if (!content || !topic) {
      return NextResponse.json({ error: "Missing content or topic" }, { status: 400 })
    }

    const blob = await createBriefingBlob(content, topic, { partyName })
    const buffer = Buffer.from(await blob.arrayBuffer())

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="briefing-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[pdf] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
