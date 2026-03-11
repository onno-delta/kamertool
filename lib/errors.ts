import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * Return a safe error response that never leaks internal details to the client.
 * Logs the full error server-side for debugging.
 */
export function safeErrorResponse(
  error: unknown,
  status?: number
): NextResponse {
  console.error("[safeErrorResponse]", error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Ongeldige invoer", details: error.issues.map((e) => e.message) },
      { status: 400 }
    )
  }

  if (
    error instanceof Error &&
    (error.message.includes("Unauthorized") || error.message.includes("unauthorized"))
  ) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 })
  }

  return NextResponse.json(
    { error: "Er is een fout opgetreden" },
    { status: status ?? 500 }
  )
}
