"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { downloadBriefingPDF } from "@/lib/download-pdf"
import type { Phase } from "./progress-sidebar"

export type BriefingState = {
  topic: string
  loading: boolean
  content: string | null
  error: string | null
  partyName: string | null
  phases: Phase[]
  toolCount: number
  cancelled?: boolean
}

type Kamerlid = { id: string; naam: string; fractie?: string }

type BriefingContextType = {
  state: BriefingState | null
  startBriefing: (topic: string, soort?: string, partyOverride?: { id: string; name: string } | null, kamerledenOverride?: Kamerlid[]) => void
  cancelBriefing: () => void
  downloadPDF: () => void
  dismiss: () => void
}

const BriefingContext = createContext<BriefingContextType>({
  state: null,
  startBriefing: () => {},
  cancelBriefing: () => {},
  downloadPDF: () => {},
  dismiss: () => {},
})

export function useBriefing() {
  return useContext(BriefingContext)
}

export function BriefingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BriefingState | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startBriefing = useCallback(
    (topic: string, soort?: string, partyOverride?: { id: string; name: string } | null, kamerledenOverride?: Kamerlid[]) => {
      // Abort any previous request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({ topic, loading: true, content: null, error: null, partyName: null, phases: [], toolCount: 0 })

      // Load preferences then generate
      fetch("/api/settings/preferences", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then(async (prefs) => {
          let pName: string | null = null
          let pId: string | null = null

          // Use explicit party override if provided, otherwise fall back to user's default
          if (partyOverride) {
            pId = partyOverride.id
            pName = partyOverride.name
          } else if (partyOverride === undefined && prefs?.defaultPartyId) {
            // Only auto-resolve from preferences when no override was passed at all
            const parties = await fetch("/api/parties", { signal: controller.signal }).then((r) => r.json())
            const party = parties.find(
              (p: { id: string; shortName: string }) => p.id === prefs.defaultPartyId
            )
            if (party) {
              pName = party.shortName
              pId = party.id
            }
          }
          // partyOverride === null means explicitly "no party"

          setState((s) => (s ? { ...s, partyName: pName } : s))

          // Collect kamerlid names for the briefing (override > preferences)
          const kamerledenSource = kamerledenOverride ?? prefs?.kamerleden ?? []
          const kamerledenNames = kamerledenSource.map(
            (k: { naam: string; fractie?: string }) =>
              k.fractie ? `${k.naam} (${k.fractie})` : k.naam
          )

          // Find the meeting skill for this soort (user override or default)
          const userSkills: Record<string, string> = prefs?.meetingSkills ?? {}
          const meetingSkill = soort ? (userSkills[soort] || undefined) : undefined

          const res = await fetch("/api/briefing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, partyId: pId, partyName: pName, kamerleden: kamerledenNames, soort, meetingSkill }),
            signal: controller.signal,
          })

          if (!res.ok) {
            const data = await res.json()
            setState((s) =>
              s?.topic === topic
                ? { ...s, loading: false, error: data.error ?? "Kon briefing niet genereren" }
                : s
            )
            return
          }

          // Parse NDJSON stream
          const reader = res.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split("\n")
            buffer = lines.pop()! // keep incomplete line

            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const event = JSON.parse(line)

                if (event.type === "steps") {
                  // Initialize deliverable phases from server
                  const steps = event.steps as string[]
                  setState((s) => {
                    if (!s || s.topic !== topic) return s
                    return {
                      ...s,
                      phases: steps.map((label: string, i: number) => ({
                        label,
                        status: i === 0 ? "running" as const : "idle" as const,
                      })),
                    }
                  })
                } else if (event.type === "section") {
                  // A section header was detected — advance progress
                  const title = (event.title as string).toLowerCase().trim()
                  setState((s) => {
                    if (!s || s.topic !== topic) return s
                    const sectionIdx = s.phases.findIndex(
                      (p) => p.label.toLowerCase().trim() === title
                    )
                    if (sectionIdx === -1) return s
                    return {
                      ...s,
                      phases: s.phases.map((p, i) => ({
                        ...p,
                        status: i < sectionIdx ? "done" as const
                          : i === sectionIdx ? "running" as const
                          : p.status,
                      })),
                    }
                  })
                } else if (event.type === "tool-call") {
                  // Track tool call count for progress display
                  setState((s) => {
                    if (!s || s.topic !== topic) return s
                    return { ...s, toolCount: s.toolCount + 1 }
                  })
                } else if (event.type === "done") {
                  setState((s) =>
                    s?.topic === topic
                      ? {
                          ...s,
                          loading: false,
                          content: event.content,
                          phases: s.phases.map((p) => ({ ...p, status: "done" as const })),
                        }
                      : s
                  )
                } else if (event.type === "error") {
                  setState((s) =>
                    s?.topic === topic
                      ? { ...s, loading: false, error: event.message ?? "Kon briefing niet genereren" }
                      : s
                  )
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return
          setState((s) =>
            s?.topic === topic
              ? { ...s, loading: false, error: "Kon briefing niet genereren" }
              : s
          )
        })
    },
    []
  )

  const downloadPDF = useCallback(() => {
    if (state?.content && state.topic) {
      downloadBriefingPDF(state.content, state.topic)
    }
  }, [state])

  const cancelBriefing = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState((s) => s ? { ...s, loading: false, cancelled: true } : s)
  }, [])

  const dismiss = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(null)
  }, [])

  return (
    <BriefingContext.Provider value={{ state, startBriefing, cancelBriefing, downloadPDF, dismiss }}>
      {children}
    </BriefingContext.Provider>
  )
}
