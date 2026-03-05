"use client"

import { SessionProvider } from "next-auth/react"
import { BriefingProvider } from "./briefing-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BriefingProvider>{children}</BriefingProvider>
    </SessionProvider>
  )
}
