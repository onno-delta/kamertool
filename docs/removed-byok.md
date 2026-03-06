---
date: 2026-03-06
tags:
  - architecture
  - removed-feature
---

# Removed: BYOK (Bring Your Own Key)

Removed on 2026-03-06. Kamertool is a sponsored tool — all users use the platform API keys.

## What was removed

### Frontend (`components/chat.tsx`)
- `activeKey` state and `activeKeyRef` ref
- Fetch to `/api/settings/keys` on mount to check for active BYOK key
- Conditional toolbar: showed "eigen key" badge when BYOK active, model selector when not

### Frontend (`app/settings/page.tsx`)
- Full API key management UI:
  - Provider selector (Anthropic, OpenAI, Google)
  - Model selector per provider
  - API key input field
  - "Test key" and "Opslaan" buttons
  - Existing keys list with activate/delete actions
- Types: `StoredKey`, `ModelOption`
- Constants: `PROVIDERS`, `MODEL_OPTIONS` (local to settings page)
- Functions: `loadKeys()`, `handleTest()`, `handleSave()`, `handleDelete()`, `handleActivate()`
- State: `keys`, `loading`, `saving`, `testing`, `testResult`, `provider`, `apiKey`, `model`, `modelsForProvider`

### Backend (`app/api/chat/route.ts`, `app/api/briefing/route.ts`)
- Import of `getActiveKey` from `@/lib/user-keys`
- BYOK check: `if (userId) { const userKey = await getActiveKey(userId); ... }`
- `usingOwnKey` flag that skipped rate limiting
- `modelOpts` was set from user's stored key; now set from request body only

### Models (`lib/ai.ts`)
- Removed models:
  - `claude-opus-4-6` (too expensive for sponsored use)
  - `claude-sonnet-4-5` → renamed to `claude-sonnet-4` (fixed wrong model ID `claude-sonnet-4-5-20250514` → `claude-sonnet-4-20250514`)
  - `gemini-2.5-pro` (cost)
  - `gpt-4o-mini` (simplified options)
- Default changed from `claude-sonnet-4-5` to `claude-sonnet-4`

## What still exists but is unused

These files/routes still exist and could be re-enabled:
- `lib/user-keys.ts` — encrypt/decrypt/store API keys
- `lib/crypto.ts` — AES-256-GCM encryption
- `app/api/settings/keys/route.ts` — GET/POST API keys
- `app/api/settings/keys/[id]/route.ts` — DELETE key
- `app/api/settings/keys/test/route.ts` — test a key
- `lib/db/schema.ts` — `user_api_key` table still in schema

## How to re-enable

1. Add BYOK models back to `lib/ai.ts` MODELS map
2. Re-add `getActiveKey` import + check in chat/briefing routes
3. Re-add `usingOwnKey` flag to skip rate limiting
4. Restore API key management UI in `app/settings/page.tsx`
5. Restore `activeKey` state + fetch in `components/chat.tsx`
