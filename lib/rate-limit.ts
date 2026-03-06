import { db } from "@/lib/db"
import { usageLog } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const FREE_TIER_LIMIT = 10

const UNLIMITED_DOMAINS = [
  "herprogrammeerdeoverheid.nl",
  "deltainstituut.nl",
  "tweedekamer.nl",
]

export function isUnlimitedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const domain = email.split("@")[1]?.toLowerCase()
  return UNLIMITED_DOMAINS.includes(domain)
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndIncrementUsage(
  userId: string | null,
  sessionId: string | null,
  ip: string | null = null
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

  // Also check IP-based bucket for anonymous users
  if (!userId && ip) {
    const ipSessionId = `ip:${ip}`
    const [ipExisting] = await db
      .select()
      .from(usageLog)
      .where(and(eq(usageLog.sessionId, ipSessionId), eq(usageLog.date, date)))
      .limit(1)
    const ipUsed = ipExisting?.messageCount ?? 0
    if (ipUsed >= FREE_TIER_LIMIT) {
      return { allowed: false, used: ipUsed, limit: FREE_TIER_LIMIT }
    }
  }

  if (used >= FREE_TIER_LIMIT) {
    return { allowed: false, used, limit: FREE_TIER_LIMIT }
  }

  // Increment session bucket
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

  // Increment IP bucket for anonymous users
  if (!userId && ip) {
    const ipSessionId = `ip:${ip}`
    const [ipExisting] = await db
      .select()
      .from(usageLog)
      .where(and(eq(usageLog.sessionId, ipSessionId), eq(usageLog.date, date)))
      .limit(1)
    if (ipExisting) {
      await db
        .update(usageLog)
        .set({ messageCount: ipExisting.messageCount + 1 })
        .where(eq(usageLog.id, ipExisting.id))
    } else {
      await db.insert(usageLog).values({
        userId: null,
        sessionId: ipSessionId,
        date,
        messageCount: 1,
      })
    }
  }

  return { allowed: true, used: used + 1, limit: FREE_TIER_LIMIT }
}

export async function getUsage(
  userId: string | null,
  sessionId: string | null
): Promise<{ used: number; limit: number }> {
  if (!userId && !sessionId) return { used: 0, limit: FREE_TIER_LIMIT }
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
