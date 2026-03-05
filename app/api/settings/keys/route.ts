import { auth } from "@/auth"
import { listKeys, saveKey, type Provider } from "@/lib/user-keys"
import { MODEL_OPTIONS } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[settings/keys] GET", { userId: session.user.id })

    const keys = await listKeys(session.user.id)
    return NextResponse.json(keys)
  } catch (error) {
    console.error("[settings/keys] GET ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider, apiKey, model, label } = await req.json()
    console.log("[settings/keys] POST", { userId: session.user.id, provider, model, label })

    if (!provider || !apiKey || !model) {
      return NextResponse.json(
        { error: "provider, apiKey, and model are required" },
        { status: 400 }
      )
    }

    const validProviders: Provider[] = ["anthropic", "openai", "google"]
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    const validModel = MODEL_OPTIONS.find(
      (m) => m.key === model && m.provider === provider
    )
    if (!validModel) {
      return NextResponse.json({ error: "Invalid model for provider" }, { status: 400 })
    }

    await saveKey(session.user.id, provider, apiKey, model, label)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[settings/keys] POST ERROR:", error)
    return NextResponse.json(
      { error: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
