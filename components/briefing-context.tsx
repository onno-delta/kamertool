"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { ToolStep } from "./progress-sidebar"
import { getStepLabel } from "./progress-sidebar"

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.6 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 20 },
  content: { fontSize: 11, lineHeight: 1.6 },
})

function BriefingPDF({ topic, content }: { topic: string; content: string }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View>
          <Text style={pdfStyles.title}>Debatbriefing: {topic}</Text>
          <Text style={pdfStyles.subtitle}>
            Gegenereerd op {new Date().toLocaleDateString("nl-NL")}
          </Text>
          <Text style={pdfStyles.content}>{content}</Text>
        </View>
      </Page>
    </Document>
  )
}

export type BriefingState = {
  topic: string
  loading: boolean
  content: string | null
  error: string | null
  partyName: string | null
  steps: ToolStep[]
}

type BriefingContextType = {
  state: BriefingState | null
  startBriefing: (topic: string) => void
  downloadPDF: () => void
  dismiss: () => void
}

const BriefingContext = createContext<BriefingContextType>({
  state: null,
  startBriefing: () => {},
  downloadPDF: () => {},
  dismiss: () => {},
})

export function useBriefing() {
  return useContext(BriefingContext)
}

export function BriefingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BriefingState | null>(null)

  const triggerDownload = useCallback(async (text: string, title: string) => {
    const blob = await pdf(<BriefingPDF topic={title} content={text} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `briefing-${title.slice(0, 30).replace(/\s+/g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const startBriefing = useCallback(
    (topic: string) => {
      setState({ topic, loading: true, content: null, error: null, partyName: null, steps: [] })

      // Load preferences then generate
      fetch("/api/settings/preferences")
        .then((r) => (r.ok ? r.json() : null))
        .then(async (prefs) => {
          let pName: string | null = null
          let pId: string | null = null
          if (prefs?.defaultPartyId) {
            const parties = await fetch("/api/parties").then((r) => r.json())
            const party = parties.find(
              (p: { id: string; shortName: string }) => p.id === prefs.defaultPartyId
            )
            if (party) {
              pName = party.shortName
              pId = party.id
            }
          }

          setState((s) => (s ? { ...s, partyName: pName } : s))

          const res = await fetch("/api/briefing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, partyId: pId, partyName: pName }),
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
        .catch(() => {
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

  const dismiss = useCallback(() => setState(null), [])

  return (
    <BriefingContext.Provider value={{ state, startBriefing, downloadPDF, dismiss }}>
      {children}
    </BriefingContext.Provider>
  )
}
