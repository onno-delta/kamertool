"use client"

import { useState, useEffect } from "react"
import { downloadBriefingPDF } from "@/lib/pdf-template"

type Props = {
  topic: string
  partyId?: string | null
  partyName?: string | null
  organisationId?: string | null
  onClose: () => void
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
      .then(async (data) => {
        setContent(data.content)
        setLoading(false)
        // Auto-download PDF
        if (data.content) {
          downloadBriefingPDF(data.content, topic)
        }
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
    downloadBriefingPDF(content, topic)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-primary-15 px-6 py-4">
          <h2 className="text-lg font-semibold text-primary">Debatbriefing: {topic}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={!content}
              className="rounded-lg border border-primary-30 px-3 py-1.5 text-sm text-primary hover:bg-primary-15 disabled:opacity-50"
            >
              Kopieer markdown
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!content}
              className="rounded-lg border border-primary-30 bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Download PDF
            </button>
            <button onClick={onClose} className="rounded-lg border border-primary-30 px-3 py-1.5 text-sm text-primary hover:bg-primary-15">
              Sluiten
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 64px)" }}>
          {loading && <p className="text-primary-75">Briefing wordt gegenereerd...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {content && (
            <div className="prose max-w-none whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  )
}
