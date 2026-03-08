"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

type Party = { id: string; name: string; shortName: string }

type Kamerlid = { id: string; naam: string; fractie?: string }

type Source = { id: string; url: string; title?: string | null }

type Preferences = {
  defaultPartyId: string | null
  searchBeyondSources: boolean
  dossiers: string[]
  kamerleden: Kamerlid[]
  meetingSkills: Record<string, string>
  sources: Source[]
}

type DataContextType = {
  parties: Party[]
  preferences: Preferences | null
  refreshPreferences: () => Promise<void>
  sessionKamerleden: Kamerlid[]
  addSessionKamerlid: (k: Kamerlid) => void
  removeSessionKamerlid: (id: string) => void
}

const DataContext = createContext<DataContextType>({
  parties: [],
  preferences: null,
  refreshPreferences: async () => {},
  sessionKamerleden: [],
  addSessionKamerlid: () => {},
  removeSessionKamerlid: () => {},
})

export function useDataContext() {
  return useContext(DataContext)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [parties, setParties] = useState<Party[]>([])
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [sessionKamerleden, setSessionKamerleden] = useState<Kamerlid[]>([])

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/preferences")
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
        setSessionKamerleden(data.kamerleden ?? [])
      }
    } catch { /* unauthenticated or network error */ }
  }, [])

  const addSessionKamerlid = useCallback((k: Kamerlid) => {
    setSessionKamerleden((prev) =>
      prev.some((existing) => existing.id === k.id) ? prev : [...prev, k]
    )
  }, [])

  const removeSessionKamerlid = useCallback((id: string) => {
    setSessionKamerleden((prev) => prev.filter((k) => k.id !== id))
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
    <DataContext.Provider value={{ parties, preferences, refreshPreferences: fetchPreferences, sessionKamerleden, addSessionKamerlid, removeSessionKamerlid }}>
      {children}
    </DataContext.Provider>
  )
}
