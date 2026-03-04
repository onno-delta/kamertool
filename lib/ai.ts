import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"

const MODELS: Record<string, { provider: string; modelId: string }> = {
  "claude-sonnet-4-5": { provider: "anthropic", modelId: "claude-sonnet-4-5-20250514" },
  "claude-haiku-4-5": { provider: "anthropic", modelId: "claude-haiku-4-5-20251001" },
  "gpt-4o": { provider: "openai", modelId: "gpt-4o" },
  "gpt-4o-mini": { provider: "openai", modelId: "gpt-4o-mini" },
  "gemini-2.5-pro": { provider: "google", modelId: "gemini-2.5-pro-preview-05-06" },
  "gemini-2.5-flash": { provider: "google", modelId: "gemini-2.5-flash-preview-04-17" },
}

export const MODEL_OPTIONS = Object.entries(MODELS).map(([key, val]) => ({
  key,
  provider: val.provider,
  label: key,
}))

export const DEFAULT_MODEL = "claude-sonnet-4-5"

function createProviderModel(
  provider: string,
  modelId: string,
  apiKey?: string
): LanguageModel {
  switch (provider) {
    case "anthropic": {
      const client = createAnthropic(apiKey ? { apiKey } : undefined)
      return client(modelId)
    }
    case "openai": {
      const client = createOpenAI(apiKey ? { apiKey } : undefined)
      return client(modelId)
    }
    case "google": {
      const client = createGoogleGenerativeAI(apiKey ? { apiKey } : undefined)
      return client(modelId)
    }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Get a language model. If userApiKey is provided, creates a fresh provider
 * instance with that key. Otherwise falls back to env var keys.
 */
export function getModel(opts?: {
  model?: string
  apiKey?: string
}): LanguageModel {
  const modelKey = opts?.model || DEFAULT_MODEL
  const entry = MODELS[modelKey]
  if (!entry) throw new Error(`Unknown model: ${modelKey}`)
  return createProviderModel(entry.provider, entry.modelId, opts?.apiKey)
}
