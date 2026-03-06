"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { ToolStep } from "./progress-sidebar"
import { getStepLabel } from "./progress-sidebar"

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.55, color: "#1a1a1a" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#1a3a5c" },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 20 },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a3a5c", marginTop: 18, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#d0d0d0", paddingBottom: 3 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1a3a5c", marginTop: 14, marginBottom: 5 },
  h3: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: "#2a5a8c", marginTop: 10, marginBottom: 4 },
  h4: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#333", marginTop: 8, marginBottom: 3 },
  p: { fontSize: 10.5, lineHeight: 1.55, marginBottom: 6 },
  bullet: { fontSize: 10.5, lineHeight: 1.55, marginBottom: 3, paddingLeft: 16 },
  bulletDot: { position: "absolute", left: 0 },
  hr: { borderBottomWidth: 0.5, borderBottomColor: "#ddd", marginTop: 10, marginBottom: 10 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
})

/** Parse inline **bold** and *italic* into Text segments */
type PdfStyle = (typeof s)[keyof typeof s]

function renderInline(text: string, baseStyle?: PdfStyle) {
  const parts: React.ReactNode[] = []
  // Match **bold**, *italic*, or plain text
  const regex = /(\*\*.*?\*\*|\*.*?\*|[^*]+|\*)/g
  let match
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    const seg = match[1]
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
      parts.push(<Text key={i++} style={s.bold}>{seg.slice(2, -2)}</Text>)
    } else if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 2) {
      parts.push(<Text key={i++} style={s.italic}>{seg.slice(1, -1)}</Text>)
    } else {
      parts.push(<Text key={i++}>{seg}</Text>)
    }
  }
  return <Text style={baseStyle ?? s.p}>{parts}</Text>
}

function BriefingPDF({ topic, content }: { topic: string; content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) continue

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<View key={i++} style={s.hr} />)
      continue
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      elements.push(renderInline(trimmed.slice(5), s.h4))
      // Fix key
      elements[elements.length - 1] = <View key={i++}>{renderInline(trimmed.slice(5), s.h4)}</View>
      continue
    }
    if (trimmed.startsWith("### ")) {
      elements.push(<View key={i++}>{renderInline(trimmed.slice(4), s.h3)}</View>)
      continue
    }
    if (trimmed.startsWith("## ")) {
      elements.push(<View key={i++}>{renderInline(trimmed.slice(3), s.h2)}</View>)
      continue
    }
    if (trimmed.startsWith("# ")) {
      elements.push(<View key={i++}><Text style={s.h1}>{trimmed.slice(2)}</Text></View>)
      continue
    }

    // Bullet points
    if (trimmed.startsWith("- ")) {
      elements.push(
        <View key={i++} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 16, fontSize: 10.5 }}>•  </Text>
          <View style={{ flex: 1 }}>{renderInline(trimmed.slice(2))}</View>
        </View>
      )
      continue
    }

    // Numbered items (e.g. "1. text")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      elements.push(
        <View key={i++} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 20, fontSize: 10.5 }}>{numMatch[1]}. </Text>
          <View style={{ flex: 1 }}>{renderInline(numMatch[2])}</View>
        </View>
      )
      continue
    }

    // Regular paragraph — collect continuation lines
    let para = trimmed
    while (li + 1 < lines.length) {
      const next = lines[li + 1].trim()
      if (!next || next.startsWith("#") || next.startsWith("- ") || next === "---" || next === "***" || /^\d+\.\s+/.test(next)) break
      para += " " + next
      li++
    }
    elements.push(<View key={i++}>{renderInline(para, s.p)}</View>)
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Debatbriefing: {topic}</Text>
        <Text style={s.subtitle}>
          Gegenereerd op {new Date().toLocaleDateString("nl-NL")}
        </Text>
        {elements}
      </Page>
    </Document>
  )
}

export async function downloadBriefingPDF(content: string, topic: string) {
  const blob = await pdf(<BriefingPDF topic={topic} content={content} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `briefing-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

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
    const blob = await pdf(<BriefingPDF topic={title} content={text} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `briefing-${title.slice(0, 30).replace(/\s+/g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
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
