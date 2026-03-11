import { auth } from "@/auth"
import { db } from "@/lib/db"
import { smoelenboekMedewerkers } from "@/lib/db/schema"
import { smoelenboekMedewerkerSchema } from "@/lib/validation"
import { NextResponse } from "next/server"
import { safeErrorResponse } from "@/lib/errors"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: personId } = await params
    const body = await req.json()
    const parsed = smoelenboekMedewerkerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const [result] = await db
      .insert(smoelenboekMedewerkers)
      .values({
        personId,
        ...parsed.data,
        submittedBy: session.user.id,
      })
      .returning()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[smoelenboek/medewerker] ERROR:", error)
    return safeErrorResponse(error)
  }
}
