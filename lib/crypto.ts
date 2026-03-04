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
