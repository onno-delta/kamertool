import { auth } from "@/auth"
import { db } from "@/lib/db"
import { briefings } from "@/lib/db/schema"
import { eq, desc, like, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  return NextResponse.json(results)
}
