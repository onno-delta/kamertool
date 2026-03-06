import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core"

// --- App tables ---
// Defined before `users` so that `organisations.createdBy` can reference `users`
// without a circular `.references()` issue.

export const parties = pgTable("party", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  shortName: text("shortName").notNull().unique(),
  programme: text("programme").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

export const organisations = pgTable("organisation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // FK to users is intentionally omitted here to avoid a circular reference
  // at the Drizzle schema level. The column still exists; the constraint
  // can be added in a custom migration if needed.
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

// --- Auth tables (required by NextAuth / @auth/drizzle-adapter) ---

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").notNull().default("member"),
  organisationId: text("organisationId").references(() => organisations.id),
  defaultPartyId: text("defaultPartyId").references(() => parties.id),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// --- Remaining app tables ---

export const orgDocuments = pgTable("org_document", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organisationId: text("organisationId")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const briefings = pgTable("briefing", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  organisationId: text("organisationId").references(() => organisations.id),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatSessions = pgTable("chat_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id),
  partyId: text("partyId").references(() => parties.id),
  topic: text("topic"),
  messages: text("messages").notNull().default("[]"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

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

export const userDossiers = pgTable("user_dossier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dossier: text("dossier").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const userKamerleden = pgTable("user_kamerlid", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  persoonId: text("persoonId").notNull(),
  naam: text("naam").notNull(),
  fractie: text("fractie"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const userMeetingSkills = pgTable("user_meeting_skill", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  soort: text("soort").notNull(), // e.g. "Plenair debat", "Commissiedebat"
  prompt: text("prompt").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

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
