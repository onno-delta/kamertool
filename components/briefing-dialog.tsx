"use client"

import { useState, useEffect } from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

type Props = {
  topic: string
  partyId?: string | null
  partyName?: string | null
  organisationId?: string | null
  onClose: () => void
}

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

export function BriefingDialog({ topic, partyId, partyName, organisationId, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, partyId, partyName, organisationId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content)
        setLoading(false)
      })
      .catch(() => {
        setError("Kon briefing niet genereren")
        setLoading(false)
      })
  }, [topic, partyId, partyName, organisationId])

  const handleCopyMarkdown = () => {
    if (content) navigator.clipboard.writeText(content)
  }

  const handleDownloadPDF = async () => {
    if (!content) return
    const blob = await pdf(<BriefingPDF topic={topic} content={content} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `briefing-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Debatbriefing: {topic}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={!content}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Kopieer markdown
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!content}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Download PDF
            </button>
            <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
              Sluiten
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 64px)" }}>
          {loading && <p className="text-gray-500">Briefing wordt gegenereerd...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {content && (
            <div className="prose max-w-none whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  )
}
