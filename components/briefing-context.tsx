"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

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

type BriefingState = {
  topic: string
  loading: boolean
  content: string | null
  error: string | null
  partyName: string | null
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
      setState({ topic, loading: true, content: null, error: null, partyName: null })

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
          const data = await res.json()

          if (data.content) {
            setState((s) =>
              s?.topic === topic ? { ...s, loading: false, content: data.content } : s
            )
            triggerDownload(data.content, topic)
          } else {
            setState((s) =>
              s?.topic === topic
                ? { ...s, loading: false, error: data.error ?? "Kon briefing niet genereren" }
                : s
            )
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
