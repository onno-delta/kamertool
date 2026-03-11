import { db } from "@/lib/db"
import { usageLog } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

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

/**
 * Atomically check and increment usage using INSERT ... ON CONFLICT.
 * Requires unique partial indexes:
 *   usage_log_user_date ON ("userId", "date") WHERE "userId" IS NOT NULL
 *   usage_log_session_date ON ("sessionId", "date") WHERE "sessionId" IS NOT NULL
 */
async function atomicUpsert(
  userId: string | null,
  sessionId: string | null,
  date: string,
  limit: number
): Promise<{ allowed: boolean; used: number }> {
  if (userId) {
    const result = await db.execute(sql`
      INSERT INTO usage_log ("id", "userId", "sessionId", "date", "messageCount")
      VALUES (${crypto.randomUUID()}, ${userId}, ${sessionId}, ${date}, 1)
      ON CONFLICT ("userId", "date") WHERE "userId" IS NOT NULL
      DO UPDATE SET "messageCount" = usage_log."messageCount" + 1
      WHERE usage_log."messageCount" < ${limit}
      RETURNING "messageCount"
    `)
    if (result.length === 0) {
      return { allowed: false, used: limit }
    }
    return { allowed: true, used: (result[0] as { messageCount: number }).messageCount }
  } else if (sessionId) {
    const result = await db.execute(sql`
      INSERT INTO usage_log ("id", "sessionId", "date", "messageCount")
      VALUES (${crypto.randomUUID()}, ${sessionId}, ${date}, 1)
      ON CONFLICT ("sessionId", "date") WHERE "sessionId" IS NOT NULL
      DO UPDATE SET "messageCount" = usage_log."messageCount" + 1
      WHERE usage_log."messageCount" < ${limit}
      RETURNING "messageCount"
    `)
    if (result.length === 0) {
      return { allowed: false, used: limit }
    }
    return { allowed: true, used: (result[0] as { messageCount: number }).messageCount }
  }
  return { allowed: true, used: 0 }
}

export async function checkAndIncrementUsage(
  userId: string | null,
  sessionId: string | null,
  ip: string | null = null
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const date = todayUTC()

  // Check IP bucket first for anonymous users
  if (!userId && ip) {
    const ipSessionId = `ip:${ip}`
    const ipResult = await atomicUpsert(null, ipSessionId, date, FREE_TIER_LIMIT)
    if (!ipResult.allowed) {
      return { allowed: false, used: ipResult.used, limit: FREE_TIER_LIMIT }
    }
  }

  // Main session/user bucket
  const result = await atomicUpsert(userId, sessionId, date, FREE_TIER_LIMIT)
  if (!result.allowed) {
    return { allowed: false, used: result.used, limit: FREE_TIER_LIMIT }
  }

  return { allowed: true, used: result.used, limit: FREE_TIER_LIMIT }
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
