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
