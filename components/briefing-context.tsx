"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { downloadBriefingPDF } from "@/lib/pdf-template"
import type { ToolStep } from "./progress-sidebar"
import { getStepLabel } from "./progress-sidebar"

export type BriefingState = {
  topic: string
  loading: boolean
  content: string | null
  error: string | null
  partyName: string | null
  steps: ToolStep[]
  cancelled?: boolean
}

type BriefingContextType = {
  state: BriefingState | null
  startBriefing: (topic: string, soort?: string) => void
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

  const triggerDownload = useCallback(async (text: string, title: string) => {
    downloadBriefingPDF(text, title)
  }, [])

  const startBriefing = useCallback(
    (topic: string, soort?: string) => {
      // Abort any previous request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({ topic, loading: true, content: null, error: null, partyName: null, steps: [] })

      // Load preferences then generate
      fetch("/api/settings/preferences", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then(async (prefs) => {
          let pName: string | null = null
          let pId: string | null = null
          if (prefs?.defaultPartyId) {
            const parties = await fetch("/api/parties", { signal: controller.signal }).then((r) => r.json())
            const party = parties.find(
              (p: { id: string; shortName: string }) => p.id === prefs.defaultPartyId
            )
            if (party) {
              pName = party.shortName
              pId = party.id
            }
          }

          setState((s) => (s ? { ...s, partyName: pName } : s))

          // Collect kamerlid names for the briefing
          const kamerledenNames = (prefs?.kamerleden ?? []).map(
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

                if (event.type === "tool-start") {
                  setState((s) => {
                    if (!s || s.topic !== topic) return s
                    return {
                      ...s,
                      steps: [
                        ...s.steps,
                        {
                          id: event.id,
                          tool: event.tool,
                          label: getStepLabel(event.tool, event.args ?? {}),
                          status: "running",
                        },
                      ],
                    }
                  })
                } else if (event.type === "tool-done") {
                  setState((s) => {
                    if (!s || s.topic !== topic) return s
                    const steps = s.steps.map((step) =>
                      step.id === event.id
                        ? {
                            ...step,
                            status: "done" as const,
                            detail:
                              event.tool === "fetchWebPage"
                                ? "opgehaald"
                                : `${event.count ?? 0} resultaten`,
                          }
                        : step
                    )
                    return { ...s, steps }
                  })
                } else if (event.type === "done") {
                  setState((s) =>
                    s?.topic === topic
                      ? { ...s, loading: false, content: event.content }
                      : s
                  )
                  if (event.content) {
                    triggerDownload(event.content, topic)
                  }
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
    [triggerDownload]
  )

  const downloadPDF = useCallback(() => {
    if (state?.content && state.topic) {
      triggerDownload(state.content, state.topic)
    }
  }, [state, triggerDownload])

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
