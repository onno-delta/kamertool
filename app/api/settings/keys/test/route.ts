import { auth } from "@/auth"
import { getModel } from "@/lib/ai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider, apiKey, model } = await req.json()
    console.log("[settings/keys/test] POST", { userId: session.user.id, provider, model })

    if (!provider || !apiKey || !model) {
      return NextResponse.json(
        { error: "provider, apiKey, and model are required" },
        { status: 400 }
      )
    }

    const llm = getModel({ model, apiKey })
    await generateText({
      model: llm,
      prompt: "Say 'ok' and nothing else.",
      maxOutputTokens: 5,
    })
    console.log("[settings/keys/test] key valid")
    return NextResponse.json({ valid: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Key validation failed"
    console.error("[settings/keys/test] ERROR:", message)
    return NextResponse.json({ valid: false, error: message }, { status: 400 })
  }
}
