"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

type Party = { id: string; name: string; shortName: string }

type Kamerlid = { id: string; naam: string; fractie?: string }

type Preferences = {
  defaultPartyId: string | null
  dossiers: string[]
  kamerleden: Kamerlid[]
  meetingSkills: Record<string, string>
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
  const initializedRef = useRef(false)

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/preferences")
      if (res.ok) {
        setPreferences(await res.json())
      }
    } catch { /* unauthenticated or network error */ }
  }, [])

  // Initialize sessionKamerleden from preferences on first load only
  useEffect(() => {
    if (preferences?.kamerleden && !initializedRef.current) {
      setSessionKamerleden(preferences.kamerleden)
      initializedRef.current = true
    }
  }, [preferences])

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
