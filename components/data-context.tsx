"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

type Party = { id: string; name: string; shortName: string }

type Preferences = {
  defaultPartyId: string | null
  dossiers: string[]
  kamerleden: { id: string; naam: string; fractie?: string }[]
  meetingSkills: Record<string, string>
}

type DataContextType = {
  parties: Party[]
  preferences: Preferences | null
  refreshPreferences: () => Promise<void>
}

const DataContext = createContext<DataContextType>({
  parties: [],
  preferences: null,
  refreshPreferences: async () => {},
})

export function useDataContext() {
  return useContext(DataContext)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [parties, setParties] = useState<Party[]>([])
  const [preferences, setPreferences] = useState<Preferences | null>(null)

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
      .catch(() => {})
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/preferences")
      if (res.ok) {
        setPreferences(await res.json())
      }
    } catch { /* unauthenticated or network error */ }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchPreferences()
    }
  }, [status, fetchPreferences])

  return (
    <DataContext.Provider value={{ parties, preferences, refreshPreferences: fetchPreferences }}>
      {children}
    </DataContext.Provider>
  )
}
