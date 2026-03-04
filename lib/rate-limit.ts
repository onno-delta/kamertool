import { db } from "@/lib/db"
import { usageLog } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const FREE_TIER_LIMIT = 10

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndIncrementUsage(
  userId: string | null,
  sessionId: string | null
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const date = todayUTC()
  const identifier = userId
    ? eq(usageLog.userId, userId)
    : eq(usageLog.sessionId, sessionId!)

  const [existing] = await db
    .select()
    .from(usageLog)
    .where(and(identifier, eq(usageLog.date, date)))
    .limit(1)

  const used = existing?.messageCount ?? 0

  if (used >= FREE_TIER_LIMIT) {
    return { allowed: false, used, limit: FREE_TIER_LIMIT }
  }

  if (existing) {
    await db
      .update(usageLog)
      .set({ messageCount: used + 1 })
      .where(eq(usageLog.id, existing.id))
  } else {
    await db.insert(usageLog).values({
      userId,
      sessionId,
      date,
      messageCount: 1,
    })
  }

  return { allowed: true, used: used + 1, limit: FREE_TIER_LIMIT }
}

export async function getUsage(
  userId: string | null,
  sessionId: string | null
): Promise<{ used: number; limit: number }> {
  const date = todayUTC()
  const identifier = userId
    ? eq(usageLog.userId, userId)
    : eq(usageLog.sessionId, sessionId!)

  const [existing] = await db
    .select()
    .from(usageLog)
    .where(and(identifier, eq(usageLog.date, date)))
    .limit(1)

  return { used: existing?.messageCount ?? 0, limit: FREE_TIER_LIMIT }
}
