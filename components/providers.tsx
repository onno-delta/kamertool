"use client"

import { SessionProvider } from "next-auth/react"
import { DataProvider } from "./data-context"
import { BriefingProvider } from "./briefing-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DataProvider>
        <BriefingProvider>{children}</BriefingProvider>
      </DataProvider>
    </SessionProvider>
  )
}
