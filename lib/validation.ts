import { z } from "zod"
import { ALLOWED_MODEL_KEYS } from "@/lib/ai"

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string().max(100_000),
    z.array(z.object({ type: z.string(), text: z.string().max(100_000) }).passthrough()).max(100),
  ]),
  id: z.string().max(100).optional(),
  parts: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough()

export const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  partyId: z.string().uuid().nullable().optional(),
  partyName: z.string().max(50).nullable().optional(),
  kamerlidNaam: z.string().max(200).nullable().optional(),
  organisationId: z.string().uuid().nullable().optional(),
  model: z.enum(ALLOWED_MODEL_KEYS).optional(),
})

export const briefingBodySchema = z.object({
  topic: z.string().min(1).max(1000),
  partyId: z.string().uuid().nullable().optional(),
  partyName: z.string().max(50).nullable().optional(),
  organisationId: z.string().uuid().nullable().optional(),
  kamerleden: z.array(z.string().max(200)).max(20).optional(),
  soort: z.string().max(100).optional(),
  meetingSkill: z.string().max(5000).optional(),
  model: z.enum(ALLOWED_MODEL_KEYS).optional(),
})

export const smoelenboekContactSchema = z.object({
  type: z.enum(["email", "twitter", "linkedin", "website"]),
  value: z.string().min(1).max(500).trim(),
  label: z.string().max(100).trim().optional(),
})

export const smoelenboekMedewerkerSchema = z.object({
  naam: z.string().min(1).max(200).trim(),
  rol: z.enum(["Persoonlijk medewerker", "Politiek assistent", "Beleidsmedewerker"]),
  email: z.string().max(200).trim().optional().or(z.literal("")),
})

export const organisationSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug mag alleen kleine letters, cijfers en streepjes bevatten"
    ),
})
