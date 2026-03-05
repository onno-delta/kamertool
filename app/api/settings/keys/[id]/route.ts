import { auth } from "@/auth"
import { deleteKey, activateKey } from "@/lib/user-keys"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log("[settings/keys] DELETE", { userId: session.user.id, keyId: id })
    await deleteKey(session.user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[settings/keys] DELETE ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log("[settings/keys] PUT (activate)", { userId: session.user.id, keyId: id })
    await activateKey(session.user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[settings/keys] PUT ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
