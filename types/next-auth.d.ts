import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      organisationId: string | null
      defaultPartyId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    organisationId: string | null
    defaultPartyId: string | null
  }
}
