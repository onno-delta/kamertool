"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
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

function VoorbereidenContent() {
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic") ?? ""

  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [partyName, setPartyName] = useState<string | null>(null)
  const [partyId, setPartyId] = useState<string | null>(null)

  const downloadPDF = useCallback(async (text: string, title: string) => {
    const blob = await pdf(<BriefingPDF topic={title} content={text} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `briefing-${title.slice(0, 30).replace(/\s+/g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    if (!topic) return

    // Load user preferences for party
    fetch("/api/settings/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then(async (prefs) => {
        let pName: string | null = null
        let pId: string | null = null
        if (prefs?.defaultPartyId) {
          const parties = await fetch("/api/parties").then((r) => r.json())
          const party = parties.find((p: { id: string; shortName: string }) => p.id === prefs.defaultPartyId)
          if (party) {
            pName = party.shortName
            pId = party.id
            setPartyName(pName)
            setPartyId(pId)
          }
        }

        // Generate briefing
        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, partyId: pId, partyName: pName }),
        })
        const data = await res.json()

        if (data.content) {
          setContent(data.content)
          setLoading(false)
          downloadPDF(data.content, topic)
        } else {
          setError(data.error ?? "Kon briefing niet genereren")
          setLoading(false)
        }
      })
      .catch(() => {
        setError("Kon briefing niet genereren")
        setLoading(false)
      })
  }, [topic, downloadPDF])

  if (!topic) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Geen onderwerp opgegeven.</p>
          <Link href="/agenda" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Terug naar agenda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/agenda" className="mb-4 inline-block text-sm text-gray-400 hover:text-gray-600">
            &larr; Terug naar agenda
          </Link>

          <h1 className="mb-6 text-xl font-semibold text-gray-900">{topic}</h1>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-blue-500" />
                <div className="text-center">
                  <p className="font-medium text-gray-700">Briefing wordt gegenereerd...</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Dit kan tot 2 minuten duren. De PDF wordt automatisch gedownload.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {content && (
            <div className="space-y-4">
              {/* PDF card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        briefing-{topic.slice(0, 30).replace(/\s+/g, "-")}.pdf
                      </p>
                      <p className="text-xs text-gray-400">
                        Gegenereerd op {new Date().toLocaleDateString("nl-NL")}
                        {partyName && <> — {partyName}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPDF(content, topic)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(content)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Kopieer tekst
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable text */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-gray-700">
                    Briefing bekijken
                  </span>
                  <span className="text-xs text-gray-400">{expanded ? "Inklappen" : "Uitklappen"}</span>
                </button>
                {expanded && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    <div className="prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VoorbereidenPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    }>
      <VoorbereidenContent />
    </Suspense>
  )
}
