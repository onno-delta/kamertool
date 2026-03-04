# BYOK + Free Tier AI Design

## Goal

Let users bring their own AI API keys (Anthropic, OpenAI, Google) for unlimited usage, while providing a free tier with rate-limited access using the app's default API key.

## Data Model

### user_api_keys

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | text | FK → user |
| provider | text | "anthropic" \| "openai" \| "google" |
| encryptedKey | text | AES-256-GCM encrypted |
| iv | text | Initialization vector |
| model | text | e.g. "claude-sonnet-4-5", "gpt-4o" |
| label | text | User-friendly name |
| isActive | boolean | Which key to use per provider |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### usage_log

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | text | FK → user, nullable |
| sessionId | text | For anonymous users |
| date | date | For daily counting |
| messageCount | integer | |
| provider | text | Which provider was used |

Free tier: 10 messages/day, resets midnight UTC. BYOK: unlimited.

## Settings Page

Route: `/settings` (auth-protected).

Three provider cards (Anthropic, OpenAI, Google) each with:
- Key input (masked after save: `sk-ant-...xxxx`)
- Model selector dropdown
- Test button (minimal API call to verify)
- Delete button

Active provider toggle to switch which one is used in chat.

### API Routes

- `POST /api/settings/keys` — save encrypted key
- `GET /api/settings/keys` — list keys (masked)
- `DELETE /api/settings/keys/[id]` — remove a key
- `POST /api/settings/keys/[id]/test` — verify key
- `PUT /api/settings/provider` — set active provider + model

## Chat Flow

```
Chat request
├─ User has own key?
│   └─ Yes → decrypt, create provider instance, unlimited
└─ No own key (free tier)
    ├─ Under 10 messages/day → use app default key
    └─ Over 10 → 429 "Limiet bereikt"
```

Changes to `lib/ai.ts`:
- `getModel()` accepts optional user key + provider
- Creates fresh provider instance: `createAnthropic({ apiKey })`, `createOpenAI({ apiKey })`, `createGoogleGenerativeAI({ apiKey })`

Chat UI badge shows current mode:
- "Claude Sonnet 4.5 (je eigen key)" — BYOK
- "Claude Sonnet 4.5 (gratis — 7/10 berichten)" — free tier

## Security

- `ENCRYPTION_KEY` env var (32-byte hex) for AES-256-GCM
- Keys never returned in full — GET returns masked only
- Test endpoint validates before saving
- `/settings` and `/api/settings/*` protected by auth middleware
- Rate limit tracked server-side (userId or session cookie)
