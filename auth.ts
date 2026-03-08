import NextAuth, { type NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  parties,
  userKamerleden,
} from "@/lib/db/schema"
import { getCurrentMembers } from "@/lib/tk-members"
import { matchKamerlid } from "@/lib/match-kamerlid"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as NextAuthConfig["adapter"],
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? "noreply@kamertool.nl",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      session.user.organisationId = user.organisationId
      session.user.defaultPartyId = user.defaultPartyId
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email?.endsWith("@tweedekamer.nl")) return

      try {
        const members = await getCurrentMembers()
        const match = matchKamerlid(user.email, members)
        if (!match) return

        // Find the party by fractie shortName
        const [party] = await db
          .select({ id: parties.id })
          .from(parties)
          .where(eq(parties.shortName, match.fractie))
          .limit(1)

        if (party) {
          await db
            .update(users)
            .set({ defaultPartyId: party.id })
            .where(eq(users.id, user.id!))
        }

        await db.insert(userKamerleden).values({
          userId: user.id!,
          persoonId: match.id,
          naam: match.naam,
          fractie: match.fractie,
        })

        console.log(
          `[auth] Auto-detected kamerlid: ${match.naam} (${match.fractie}) for ${user.email}`
        )
      } catch (error) {
        // Don't block user creation if auto-detection fails
        console.error("[auth] Auto-detect kamerlid error:", error)
      }
    },
  },
})
