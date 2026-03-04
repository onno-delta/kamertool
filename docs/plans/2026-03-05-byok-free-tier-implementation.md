# BYOK + Free Tier Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users bring their own AI API keys (Anthropic, OpenAI, Google) for unlimited chat, with a rate-limited free tier using the app's default key.

**Architecture:** Add `user_api_keys` and `usage_log` tables to Drizzle schema. Encryption module for key storage (AES-256-GCM). Settings page for key management. Chat/briefing API routes check user key → fallback to app key with rate limit. Google provider added alongside existing Anthropic + OpenAI.

**Tech Stack:** Drizzle ORM, AES-256-GCM (Node.js crypto), @ai-sdk/google, Vercel AI SDK v6, NextAuth v5

---

## Task 1: Install Google AI SDK

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
cd "/Users/onnoblom/Claude code/kamertool"
npm install @ai-sdk/google
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @ai-sdk/google dependency"
```

---

## Task 2: Add Database Tables

**Files:**
- Modify: `lib/db/schema.ts`

**Step 1: Add `userApiKeys` table to schema**

Add after the `chatSessions` table at the end of `lib/db/schema.ts`:

```typescript
export const userApiKeys = pgTable("user_api_key", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "anthropic" | "openai" | "google"
  encryptedKey: text("encryptedKey").notNull(),
  iv: text("iv").notNull(),
  model: text("model").notNull(), // e.g. "claude-sonnet-4-5", "gpt-4o"
  label: text("label"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})
```

**Step 2: Add `usageLog` table to schema**

Add after `userApiKeys`:

```typescript
export const usageLog = pgTable("usage_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  sessionId: text("sessionId"),
  date: text("date").notNull(), // "YYYY-MM-DD" for easy daily grouping
  messageCount: integer("messageCount").notNull().default(0),
  provider: text("provider"),
})
```

**Step 3: Push schema to Supabase**

```bash
cd "/Users/onnoblom/Claude code/kamertool"
npx drizzle-kit push
```

Expected: Tables `user_api_key` and `usage_log` created in Supabase.

**Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add user_api_keys and usage_log tables"
```

---

## Task 3: Encryption Module

**Files:**
- Create: `lib/crypto.ts`

**Step 1: Create the encryption module**

Create `lib/crypto.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string")
  }
  return Buffer.from(hex, "hex")
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return {
    encrypted: encrypted + ":" + authTag,
    iv: iv.toString("hex"),
  }
}

export function decrypt(encrypted: string, iv: string): string {
  const key = getKey()
  const [content, authTag] = encrypted.split(":")
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(authTag, "hex"))
  let decrypted = decipher.update(content, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
```

**Step 2: Generate an encryption key and add to `.env.local`**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add output to `.env.local` as `ENCRYPTION_KEY="<generated-hex>"`.

Also add to `.env.local.example`:

```
ENCRYPTION_KEY="generate-with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
```

**Step 3: Add ENCRYPTION_KEY to Vercel**

```bash
echo '<generated-hex>' | vercel env add ENCRYPTION_KEY production
```

**Step 4: Commit**

```bash
git add lib/crypto.ts .env.local.example
git commit -m "feat: add AES-256-GCM encryption module for API key storage"
```

---

## Task 4: Update AI Provider to Support User Keys

**Files:**
- Modify: `lib/ai.ts`

**Step 1: Rewrite `lib/ai.ts` to support user-provided keys**

Replace entire file:

```typescript
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModelV1 } from "ai"

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
): LanguageModelV1 {
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
}): LanguageModelV1 {
  const modelKey = opts?.model || DEFAULT_MODEL
  const entry = MODELS[modelKey]
  if (!entry) throw new Error(`Unknown model: ${modelKey}`)
  return createProviderModel(entry.provider, entry.modelId, opts?.apiKey)
}
```

**Step 2: Commit**

```bash
git add lib/ai.ts
git commit -m "feat: support user-provided API keys in AI provider layer"
```

---

## Task 5: Rate Limiting Helper

**Files:**
- Create: `lib/rate-limit.ts`

**Step 1: Create the rate limit module**

Create `lib/rate-limit.ts`:

```typescript
import { db } from "@/lib/db"
import { usageLog } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const FREE_TIER_LIMIT = 10

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndIncrementUsage(
  userId: string | null,
  sessionId: string | null
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const date = todayUTC()
  const identifier = userId
    ? eq(usageLog.userId, userId)
    : eq(usageLog.sessionId, sessionId!)

  const [existing] = await db
    .select()
    .from(usageLog)
    .where(and(identifier, eq(usageLog.date, date)))
    .limit(1)

  const used = existing?.messageCount ?? 0

  if (used >= FREE_TIER_LIMIT) {
    return { allowed: false, used, limit: FREE_TIER_LIMIT }
  }

  if (existing) {
    await db
      .update(usageLog)
      .set({ messageCount: used + 1 })
      .where(eq(usageLog.id, existing.id))
  } else {
    await db.insert(usageLog).values({
      userId,
      sessionId,
      date,
      messageCount: 1,
    })
  }

  return { allowed: true, used: used + 1, limit: FREE_TIER_LIMIT }
}

export async function getUsage(
  userId: string | null,
  sessionId: string | null
): Promise<{ used: number; limit: number }> {
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
```

**Step 2: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: add rate limiting for free tier (10 messages/day)"
```

---

## Task 6: User Key Helper

**Files:**
- Create: `lib/user-keys.ts`

**Step 1: Create the user keys module**

Create `lib/user-keys.ts`:

```typescript
import { db } from "@/lib/db"
import { userApiKeys } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { encrypt, decrypt } from "@/lib/crypto"

export type Provider = "anthropic" | "openai" | "google"

export async function getActiveKey(userId: string): Promise<{
  apiKey: string
  model: string
  provider: Provider
} | null> {
  const [key] = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.isActive, true)))
    .limit(1)

  if (!key) return null

  return {
    apiKey: decrypt(key.encryptedKey, key.iv),
    model: key.model,
    provider: key.provider as Provider,
  }
}

export async function listKeys(userId: string) {
  const keys = await db
    .select({
      id: userApiKeys.id,
      provider: userApiKeys.provider,
      model: userApiKeys.model,
      label: userApiKeys.label,
      isActive: userApiKeys.isActive,
      createdAt: userApiKeys.createdAt,
    })
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))

  return keys
}

export async function saveKey(
  userId: string,
  provider: Provider,
  apiKey: string,
  model: string,
  label?: string
) {
  const { encrypted, iv } = encrypt(apiKey)

  // Deactivate other keys for this user
  await db
    .update(userApiKeys)
    .set({ isActive: false })
    .where(eq(userApiKeys.userId, userId))

  await db.insert(userApiKeys).values({
    userId,
    provider,
    encryptedKey: encrypted,
    iv,
    model,
    label: label || `${provider} key`,
    isActive: true,
  })
}

export async function deleteKey(userId: string, keyId: string) {
  await db
    .delete(userApiKeys)
    .where(and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)))
}

export async function activateKey(userId: string, keyId: string) {
  await db
    .update(userApiKeys)
    .set({ isActive: false })
    .where(eq(userApiKeys.userId, userId))

  await db
    .update(userApiKeys)
    .set({ isActive: true })
    .where(and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId)))
}
```

**Step 2: Commit**

```bash
git add lib/user-keys.ts
git commit -m "feat: add user API key CRUD with encryption"
```

---

## Task 7: Settings API Routes

**Files:**
- Create: `app/api/settings/keys/route.ts`
- Create: `app/api/settings/keys/[id]/route.ts`
- Create: `app/api/settings/keys/[id]/test/route.ts`
- Create: `app/api/settings/provider/route.ts`

**Step 1: Create `app/api/settings/keys/route.ts`**

```typescript
import { auth } from "@/auth"
import { listKeys, saveKey, type Provider } from "@/lib/user-keys"
import { MODEL_OPTIONS } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const keys = await listKeys(session.user.id)
  return NextResponse.json(keys)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { provider, apiKey, model, label } = await req.json()

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
}
```

**Step 2: Create `app/api/settings/keys/[id]/route.ts`**

```typescript
import { auth } from "@/auth"
import { deleteKey, activateKey } from "@/lib/user-keys"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await deleteKey(session.user.id, id)
  return NextResponse.json({ ok: true })
}

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await activateKey(session.user.id, id)
  return NextResponse.json({ ok: true })
}
```

**Step 3: Create `app/api/settings/keys/[id]/test/route.ts`**

```typescript
import { auth } from "@/auth"
import { getModel } from "@/lib/ai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { provider, apiKey, model } = await req.json()

  if (!provider || !apiKey || !model) {
    return NextResponse.json(
      { error: "provider, apiKey, and model are required" },
      { status: 400 }
    )
  }

  try {
    const llm = getModel({ model, apiKey })
    await generateText({
      model: llm,
      prompt: "Say 'ok' and nothing else.",
      maxTokens: 5,
    })
    return NextResponse.json({ valid: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Key validation failed"
    return NextResponse.json({ valid: false, error: message }, { status: 400 })
  }
}
```

**Step 4: Create `app/api/settings/usage/route.ts`**

```typescript
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
```

**Step 5: Commit**

```bash
git add app/api/settings/
git commit -m "feat: add settings API routes for key management and usage"
```

---

## Task 8: Update Chat and Briefing Routes

**Files:**
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/briefing/route.ts`

**Step 1: Update `app/api/chat/route.ts`**

Replace entire file:

```typescript
import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { buildSystemPrompt } from "@/lib/system-prompt"
import { auth } from "@/auth"
import { getActiveKey } from "@/lib/user-keys"
import { checkAndIncrementUsage } from "@/lib/rate-limit"
import { cookies } from "next/headers"
import {
  searchKamerstukken,
  searchHandelingen,
  searchToezeggingen,
  searchStemmingen,
  searchNews,
  createSearchPartyDocs,
} from "@/lib/tools"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, partyId, partyName, organisationId } = await req.json()

  const session = await auth()
  const userId = session?.user?.id ?? null

  // Check for user's own API key
  let modelOpts: { model?: string; apiKey?: string } | undefined
  let usingOwnKey = false

  if (userId) {
    const userKey = await getActiveKey(userId)
    if (userKey) {
      modelOpts = { model: userKey.model, apiKey: userKey.apiKey }
      usingOwnKey = true
    }
  }

  // Free tier rate limiting (only when not using own key)
  if (!usingOwnKey) {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("session-id")?.value ?? null
    if (!sessionId && !userId) {
      sessionId = crypto.randomUUID()
      // Session cookie will be set by middleware or client
    }

    const { allowed, used, limit } = await checkAndIncrementUsage(userId, sessionId)
    if (!allowed) {
      return NextResponse.json(
        {
          error: "rate_limit",
          message: `Dagelijkse limiet bereikt (${limit} berichten). Voeg je eigen API key toe in Instellingen voor onbeperkt gebruik.`,
          used,
          limit,
        },
        { status: 429 }
      )
    }
  }

  const result = streamText({
    model: getModel(modelOpts),
    system: buildSystemPrompt(partyName),
    messages,
    stopWhen: stepCountIs(10),
    tools: {
      searchKamerstukken,
      searchHandelingen,
      searchToezeggingen,
      searchStemmingen,
      searchNews,
      searchPartyDocs: createSearchPartyDocs(
        partyId ?? null,
        organisationId ?? null
      ),
    },
  })

  return result.toUIMessageStreamResponse()
}
```

**Step 2: Update `app/api/briefing/route.ts`**

Add the same user key + rate limit logic. Add these imports at the top:

```typescript
import { auth } from "@/auth"
import { getActiveKey } from "@/lib/user-keys"
import { checkAndIncrementUsage } from "@/lib/rate-limit"
import { cookies } from "next/headers"
```

Add after `if (!topic)` check:

```typescript
  const session = await auth()
  const userId = session?.user?.id ?? null

  let modelOpts: { model?: string; apiKey?: string } | undefined
  let usingOwnKey = false

  if (userId) {
    const userKey = await getActiveKey(userId)
    if (userKey) {
      modelOpts = { model: userKey.model, apiKey: userKey.apiKey }
      usingOwnKey = true
    }
  }

  if (!usingOwnKey) {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session-id")?.value ?? null
    const { allowed, used, limit } = await checkAndIncrementUsage(userId, sessionId)
    if (!allowed) {
      return NextResponse.json(
        {
          error: "rate_limit",
          message: `Dagelijkse limiet bereikt (${limit} berichten).`,
          used,
          limit,
        },
        { status: 429 }
      )
    }
  }
```

Change `model: getModel()` to `model: getModel(modelOpts)` in the `generateText` call.

**Step 3: Commit**

```bash
git add app/api/chat/route.ts app/api/briefing/route.ts
git commit -m "feat: integrate BYOK and rate limiting into chat and briefing routes"
```

---

## Task 9: Update Middleware

**Files:**
- Modify: `middleware.ts`

**Step 1: Extend auth middleware matcher to protect settings routes**

Replace `middleware.ts`:

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/api/organisations/:path*", "/settings/:path*", "/api/settings/:path*"],
}
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect settings routes with auth middleware"
```

---

## Task 10: Settings Page UI

**Files:**
- Create: `app/settings/page.tsx`

**Step 1: Create the settings page**

Create `app/settings/page.tsx`:

```tsx
"use client"

import { useState, useEffect } from "react"
import { MODEL_OPTIONS } from "@/lib/ai"
import Link from "next/link"

type StoredKey = {
  id: string
  provider: string
  model: string
  label: string | null
  isActive: boolean
  createdAt: string
}

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "google", name: "Google", placeholder: "AIza..." },
] as const

export default function SettingsPage() {
  const [keys, setKeys] = useState<StoredKey[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    valid: boolean
    error?: string
  } | null>(null)

  // Form state
  const [provider, setProvider] = useState<string>("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")

  const modelsForProvider = MODEL_OPTIONS.filter((m) => m.provider === provider)

  useEffect(() => {
    setModel(modelsForProvider[0]?.key ?? "")
  }, [provider])

  async function loadKeys() {
    const res = await fetch("/api/settings/keys")
    if (res.ok) setKeys(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    loadKeys()
  }, [])

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const res = await fetch("/api/settings/keys/test/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model }),
    })
    setTestResult(await res.json())
    setTesting(false)
  }

  async function handleSave() {
    setSaving(provider)
    await fetch("/api/settings/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model }),
    })
    setApiKey("")
    setTestResult(null)
    await loadKeys()
    setSaving(null)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/keys/${id}`, { method: "DELETE" })
    await loadKeys()
  }

  async function handleActivate(id: string) {
    await fetch(`/api/settings/keys/${id}`, { method: "PUT" })
    await loadKeys()
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Instellingen</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Terug naar chat
        </Link>
      </div>

      {/* Existing keys */}
      {!loading && keys.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-medium text-gray-800">
            Je API keys
          </h2>
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  k.isActive
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {k.provider}
                    </span>
                    <span className="text-sm text-gray-500">{k.model}</span>
                    {k.isActive && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        actief
                      </span>
                    )}
                  </div>
                  {k.label && (
                    <p className="text-sm text-gray-500">{k.label}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!k.isActive && (
                    <button
                      onClick={() => handleActivate(k.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Activeren
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new key */}
      <div className="rounded-xl border border-gray-200 p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-800">
          API key toevoegen
        </h2>

        <div className="space-y-4">
          {/* Provider select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              {modelsForProvider.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API key input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                PROVIDERS.find((p) => p.id === provider)?.placeholder
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                testResult.valid
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.valid
                ? "Key is geldig!"
                : `Ongeldige key: ${testResult.error}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={!apiKey || testing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? "Testen..." : "Test key"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey || saving !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add settings page for API key management"
```

---

## Task 11: Update Chat UI with Provider Badge

**Files:**
- Modify: `components/chat.tsx`

**Step 1: Add usage/provider state and badge to chat header**

Add a `useEffect` that fetches `/api/settings/usage` and `/api/settings/keys` on mount. Display a badge in the header showing the current mode.

Add after the existing `useState` declarations:

```typescript
const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
const [activeKey, setActiveKey] = useState<{ provider: string; model: string } | null>(null)

useEffect(() => {
  fetch("/api/settings/usage").then(r => r.json()).then(setUsage).catch(() => {})
  fetch("/api/settings/keys").then(r => r.ok ? r.json() : []).then((keys: Array<{ isActive: boolean; provider: string; model: string }>) => {
    const active = keys.find((k: { isActive: boolean }) => k.isActive)
    if (active) setActiveKey({ provider: active.provider, model: active.model })
  }).catch(() => {})
}, [])
```

Add a badge in the header, after the `<h1>` tag:

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-xl font-semibold text-gray-900">Kamertool</h1>
  {activeKey ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      {activeKey.model} (je eigen key)
    </span>
  ) : usage ? (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      gratis — {usage.used}/{usage.limit} berichten
    </span>
  ) : null}
</div>
```

Replace the existing `<h1>` with the div above.

**Step 2: Commit**

```bash
git add components/chat.tsx
git commit -m "feat: add provider/usage badge to chat header"
```

---

## Task 12: Add Settings Link to Navigation

**Files:**
- Modify: `components/nav.tsx`

**Step 1: Add settings link for authenticated users**

Add a "Instellingen" link next to the existing "Organisatie" link in `components/nav.tsx`. Inside the `session` branch, add:

```tsx
<Link href="/settings" className="text-sm text-blue-600 hover:underline">
  Instellingen
</Link>
```

**Step 2: Commit**

```bash
git add components/nav.tsx
git commit -m "feat: add settings link to navigation"
```

---

## Task 13: Handle Rate Limit Errors in Chat UI

**Files:**
- Modify: `components/chat.tsx`

**Step 1: Add error handling for 429 responses**

The `useChat` hook from `@ai-sdk/react` has an `onError` callback. Add rate limit error display. After the `useChat` call, add state and handler:

```typescript
const [rateLimitError, setRateLimitError] = useState<string | null>(null)
```

Add `onError` to the `useChat` options:

```typescript
const { messages, sendMessage, status } = useChat({
  transport,
  onError(error) {
    if (error.message.includes("rate_limit") || error.message.includes("429")) {
      setRateLimitError(
        "Dagelijkse limiet bereikt. Voeg je eigen API key toe in Instellingen voor onbeperkt gebruik."
      )
    }
  },
})
```

Add a banner above the input form when `rateLimitError` is set:

```tsx
{rateLimitError && (
  <div className="mx-6 mb-2 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
    <span>{rateLimitError}</span>
    <Link href="/settings" className="ml-3 font-medium text-amber-900 underline">
      Instellingen →
    </Link>
  </div>
)}
```

Add `import Link from "next/link"` at the top.

**Step 2: Commit**

```bash
git add components/chat.tsx
git commit -m "feat: show rate limit error with link to settings"
```

---

## Task 14: Fix Test Route Path

**Files:**
- Modify: `app/settings/page.tsx`

**Step 1: Fix the test endpoint URL in settings page**

The test endpoint is at `/api/settings/keys/[id]/test` but for testing a new key before saving, it doesn't have an ID yet. Move the test route to a non-ID path.

Create `app/api/settings/keys/test/route.ts` (same content as `[id]/test/route.ts`):

```typescript
import { auth } from "@/auth"
import { getModel } from "@/lib/ai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { provider, apiKey, model } = await req.json()

  if (!provider || !apiKey || !model) {
    return NextResponse.json(
      { error: "provider, apiKey, and model are required" },
      { status: 400 }
    )
  }

  try {
    const llm = getModel({ model, apiKey })
    await generateText({
      model: llm,
      prompt: "Say 'ok' and nothing else.",
      maxTokens: 5,
    })
    return NextResponse.json({ valid: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Key validation failed"
    return NextResponse.json({ valid: false, error: message }, { status: 400 })
  }
}
```

Update the fetch URL in `app/settings/page.tsx` `handleTest`:

```typescript
const res = await fetch("/api/settings/keys/test", {
```

Delete `app/api/settings/keys/[id]/test/route.ts` (no longer needed).

**Step 2: Commit**

```bash
git add app/api/settings/keys/test/route.ts app/settings/page.tsx
git rm app/api/settings/keys/\[id\]/test/route.ts 2>/dev/null || true
git commit -m "fix: use dedicated test endpoint for key validation"
```

---

## Task 15: Build Verification and Deploy

**Step 1: Run build**

```bash
cd "/Users/onnoblom/Claude code/kamertool"
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Fix any build errors if needed**

**Step 3: Deploy to Vercel**

```bash
vercel redeploy <latest-deployment-url>
```

Or if that fails due to git author issue:

```bash
vercel --prod
```

**Step 4: Push to GitHub**

```bash
git push
```

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues for BYOK deployment"
git push
```
