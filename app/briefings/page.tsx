"use client"

import { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

type Briefing = {
  id: string
  topic: string
  content: string
  createdAt: string
}

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.6 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 20 },
  content: { fontSize: 11, lineHeight: 1.6 },
})

function BriefingPDF({ topic, content, date }: { topic: string; content: string; date: string }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View>
          <Text style={pdfStyles.title}>Debatbriefing: {topic}</Text>
          <Text style={pdfStyles.subtitle}>{date}</Text>
          <Text style={pdfStyles.content}>{content}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Briefing | null>(null)

  async function loadBriefings() {
    setLoading(true)
    const params = search ? `?q=${encodeURIComponent(search)}` : ""
    const res = await fetch(`/api/briefings${params}`)
    if (res.ok) setBriefings(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    loadBriefings()
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadBriefings()
  }

  const makePdfBlob = useCallback(async (b: Briefing) => {
    const date = new Date(b.createdAt).toLocaleDateString("nl-NL")
    return pdf(<BriefingPDF topic={b.topic} content={b.content} date={date} />).toBlob()
  }, [])

  const handleDownload = useCallback(async () => {
    if (!selected) return
    const blob = await makePdfBlob(selected)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `briefing-${selected.topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [selected, makePdfBlob])

  const handleOpenPdf = useCallback(async () => {
    if (!selected) return
    const blob = await makePdfBlob(selected)
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }, [selected, makePdfBlob])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 rounded-xl border border-primary-30 bg-white/95 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-primary">Briefinggeschiedenis</h1>
          <p className="mt-2 text-sm text-primary-75">
            Zoek en hergebruik eerder gegenereerde debatbriefings. Je kunt de tekst bekijken of
            direct een PDF downloaden.
          </p>
        </section>

        {/* Search */}
        <div className="mb-6 rounded-xl border border-primary-30 bg-white/95 p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op onderwerp..."
              className="flex-1 rounded-md border border-primary-30 px-4 py-2 text-sm text-primary placeholder:text-primary-60"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Zoeken
            </button>
          </form>
        </div>

        {loading && <p className="text-primary-75">Laden...</p>}

        {!loading && briefings.length === 0 && (
          <div className="rounded-xl border border-primary-30 bg-white/95 p-8 shadow-sm text-center">
            <p className="text-primary-75">Geen briefings gevonden. Genereer een briefing vanuit de chat.</p>
          </div>
        )}

        {/* Briefing list */}
        {!selected && (
          <div className="space-y-3">
            {briefings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="w-full rounded-xl border border-primary-30 bg-white/95 p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-primary">{b.topic}</h3>
                  <span className="text-sm text-primary-75">
                    {new Date(b.createdAt).toLocaleDateString("nl-NL")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-primary-75 line-clamp-2">
                  {b.content.slice(0, 200)}...
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Briefing detail */}
        {selected && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-primary hover:underline"
              >
                &larr; Terug naar overzicht
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="rounded-xl border border-primary-30 bg-primary px-3 py-1.5 text-sm text-white shadow-sm hover:bg-primary-dark"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleOpenPdf}
                  className="rounded-xl border border-primary-30 bg-white px-3 py-1.5 text-sm text-primary shadow-sm hover:bg-primary-15"
                >
                  Open PDF
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-primary-30 bg-white/95 p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-semibold text-primary">{selected.topic}</h2>
              <p className="mb-4 text-sm text-primary-75">
                {new Date(selected.createdAt).toLocaleDateString("nl-NL")}
              </p>
              <div className="prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
