import { auth } from "@/auth"
import { db } from "@/lib/db"
import { briefings } from "@/lib/db/schema"
import { eq, desc, like, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[briefings] GET", { userId: session.user.id })

    const url = new URL(req.url)
    const search = url.searchParams.get("q")

    let query = db
      .select({
        id: briefings.id,
        topic: briefings.topic,
        content: briefings.content,
        createdAt: briefings.createdAt,
      })
      .from(briefings)
      .where(eq(briefings.userId, session.user.id))
      .orderBy(desc(briefings.createdAt))
      .$dynamic()

    if (search) {
      query = query.where(and(eq(briefings.userId, session.user.id), like(briefings.topic, `%${search}%`)))
    }

    const results = await query.limit(50)
    console.log("[briefings] returning", results.length, "results")
    return NextResponse.json(results)
  } catch (error) {
    console.error("[briefings] ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
