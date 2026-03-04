import { createProviderRegistry } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

export const registry = createProviderRegistry({
  anthropic,
  openai,
})

export function getModel(provider?: string) {
  const modelId =
    provider || process.env.AI_PROVIDER || "anthropic:claude-sonnet-4-5"
  return registry.languageModel(
    modelId as Parameters<typeof registry.languageModel>[0]
  )
}
