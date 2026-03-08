"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

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
  const [parties, setParties] = useState<Party[]>([])
  const [preferences, setPreferences] = useState<Preferences | null>(null)

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/preferences")
      if (res.ok) {
        setPreferences(await res.json())
      }
    } catch { /* unauthenticated or network error */ }
  }, [])

  // Fetch both in parallel on mount — no need to wait for useSession().
  // The preferences endpoint uses server-side auth() which reads the
  // session cookie directly; returns 401 for unauthenticated users
  // which fetchPreferences handles gracefully.
  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
      .catch(() => {})
    fetchPreferences()
  }, [fetchPreferences])

  return (
    <DataContext.Provider value={{ parties, preferences, refreshPreferences: fetchPreferences }}>
      {children}
    </DataContext.Provider>
  )
}
