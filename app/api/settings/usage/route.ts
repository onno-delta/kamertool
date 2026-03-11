import { auth } from "@/auth"
import { getUsage, isUnlimitedEmail } from "@/lib/rate-limit"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { safeErrorResponse } from "@/lib/errors"

export async function GET() {
  try {
    const session = await auth()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session-id")?.value ?? null


    if (isUnlimitedEmail(session?.user?.email)) {
      return NextResponse.json({ used: 0, limit: Infinity, unlimited: true })
    }

    const usage = await getUsage(session?.user?.id ?? null, sessionId)
    return NextResponse.json(usage)
  } catch (error) {
    console.error("[settings/usage] ERROR:", error)
    return safeErrorResponse(error)
  }
}
