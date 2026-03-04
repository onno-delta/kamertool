import { auth } from "@/auth"
import { getUsage } from "@/lib/rate-limit"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session-id")?.value ?? null

  const usage = await getUsage(session?.user?.id ?? null, sessionId)
  return NextResponse.json(usage)
}
