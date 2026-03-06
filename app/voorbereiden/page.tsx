"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useBriefing } from "@/components/briefing-context"
import { copyAsRichText } from "@/lib/copy-rich-text"
import { ProgressSidebar } from "@/components/progress-sidebar"
import { PartySelector } from "@/components/party-selector"

type Party = { id: string; name: string; shortName: string }

function VoorbereidenContent() {
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic") ?? ""
  const soort = searchParams.get("soort") ?? undefined
  const { state, startBriefing, cancelBriefing, downloadPDF } = useBriefing()

  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [partyLoaded, setPartyLoaded] = useState(false)
  const [started, setStarted] = useState(false)

  // Load user's default party on mount
  useEffect(() => {
    fetch("/api/settings/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (prefs) => {
        if (prefs?.defaultPartyId) {
          const parties = await fetch("/api/parties").then((r) => r.json())
          const party = parties.find(
            (p: Party) => p.id === prefs.defaultPartyId
          )
          if (party) setSelectedParty(party)
        }
        setPartyLoaded(true)
      })
      .catch(() => setPartyLoaded(true))
  }, [])

  function handleStart() {
    if (!topic) return
    setStarted(true)
    const partyOverride = selectedParty
      ? { id: selectedParty.id, name: selectedParty.shortName }
      : null
    startBriefing(topic, soort, partyOverride)
  }

  if (!topic) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Geen onderwerp opgegeven.</p>
          <Link href="/agenda" className="mt-2 inline-block text-sm text-primary hover:underline">
            Terug naar agenda
          </Link>
        </div>
      </div>
    )
  }

  // Show start screen before briefing is kicked off
  const briefingActive = started && state?.topic === topic
  if (!briefingActive) {
    return (
      <div className="mx-auto w-full max-w-3xl px-0 py-2 sm:py-3">
        <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary hover:underline">Home</Link>
          <span className="mx-1.5">&rsaquo;</span>
          <Link href="/agenda" className="hover:text-primary hover:underline">Agenda</Link>
          <span className="mx-1.5">&rsaquo;</span>
          <span className="text-primary font-medium">Voorbereiding</span>
        </nav>

        <section className="rounded-lg border border-border bg-white px-6 py-6">
          <h1 className="text-2xl font-semibold text-primary">{topic}</h1>
          {soort && (
            <p className="mt-1 text-sm text-text-secondary">{soort}</p>
          )}

          <div className="mt-6 rounded-lg border border-border-light bg-surface-muted px-6 py-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  Partijperspectief
                </label>
                <p className="mb-2 text-xs text-text-muted">
                  De briefing wordt geschreven vanuit het perspectief van de gekozen partij. Laat leeg voor een neutraal overzicht.
                </p>
                {partyLoaded ? (
                  <PartySelector value={selectedParty} onChange={setSelectedParty} />
                ) : (
                  <div className="h-8 w-24 animate-pulse rounded bg-border-light" />
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleStart}
                  disabled={!partyLoaded}
                  className="rounded bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
                >
                  Briefing genereren
                </button>
                <Link
                  href="/agenda"
                  className="text-sm text-text-secondary hover:text-primary hover:underline"
                >
                  Terug naar agenda
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const loading = state?.topic === topic && state.loading
  const cancelled = state?.topic === topic && !!state.cancelled
  const content = state?.topic === topic ? state.content : null
  const error = state?.topic === topic ? state.error : null
  const partyName = state?.topic === topic ? state.partyName : null
  const steps = state?.topic === topic ? state.steps : []

  return (
    <div className={`flex min-h-0 flex-1 ${
      steps.length > 0
        ? "gap-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        : "mx-auto w-full max-w-4xl"
    }`}>
      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto max-w-3xl px-0 py-2 sm:py-3">
          <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary hover:underline">Home</Link>
            <span className="mx-1.5">&rsaquo;</span>
            <Link href="/agenda" className="hover:text-primary hover:underline">Agenda</Link>
            <span className="mx-1.5">&rsaquo;</span>
            <span className="text-primary font-medium">Voorbereiding</span>
          </nav>

          <section className="rounded-lg border border-border bg-white px-6 py-6">
            <h1 className="text-2xl font-semibold text-primary">{topic}</h1>
            {partyName && (
              <p className="mt-1 text-sm text-text-secondary">
                Briefing gericht op: {partyName}
              </p>
            )}

            {loading && (
              <div className="mt-6 rounded-lg border border-border bg-surface-muted px-6 py-6">
                <div className="flex flex-col items-center gap-4">
                  <span className="h-8 w-8 animate-spin rounded-full border-3 border-border-light border-t-primary" />
                  <div className="text-center">
                    <p className="font-medium text-primary">Briefing wordt gegenereerd...</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      De PDF wordt automatisch gedownload zodra hij klaar is.
                    </p>
                  </div>
                  <button
                    onClick={cancelBriefing}
                    className="rounded border border-border px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-red-600 hover:border-red-300"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {cancelled && !loading && !content && !error && (
              <div className="mt-6 rounded-lg border border-border bg-surface-muted px-6 py-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-text-secondary">Briefing generatie geannuleerd.</p>
                  <button
                    onClick={handleStart}
                    className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px"
                  >
                    Opnieuw proberen
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-6 py-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {content && (
              <div className="mt-6">
                <BriefingResult
                  topic={topic}
                  content={content}
                  partyName={partyName}
                  onDownload={downloadPDF}
                />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Progress sidebar */}
      {steps.length > 0 && (
        <div className="hidden min-h-0 lg:block">
          <ProgressSidebar steps={steps} />
        </div>
      )}
    </div>
  )
}

function BriefingResult({
  topic,
  content,
  partyName,
  onDownload,
}: {
  topic: string
  content: string
  partyName: string | null
  onDownload: () => void
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  // Generate PDF preview on mount
  useEffect(() => {
    let cancelled = false
    setPdfLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- initial fetch
    setPdfError(false)

    fetch("/api/briefings/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, topic, partyName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("PDF failed")
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        setPdfUrl(URL.createObjectURL(blob))
        setPdfLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setPdfError(true)
        setPdfLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [content, topic, partyName])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                briefing-{topic.slice(0, 30).replace(/\s+/g, "-")}.pdf
              </p>
              <p className="text-xs text-text-muted">
                Gegenereerd op {new Date().toLocaleDateString("nl-NL")}
                {partyName && <> - {partyName}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px"
            >
              Download PDF
            </button>
            <button
              onClick={() => copyAsRichText(content)}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface-muted active:translate-y-px"
            >
              Kopieer tekst
            </button>
          </div>
        </div>
      </div>

      {/* PDF preview */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        {pdfLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-light border-t-primary" />
            <span className="ml-3 text-sm text-text-secondary">PDF wordt geladen...</span>
          </div>
        )}
        {pdfError && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-text-secondary">PDF preview niet beschikbaar.</p>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className="h-[80vh] w-full"
            title="Briefing PDF preview"
          />
        )}
      </div>
    </div>
  )
}

export default function VoorbereidenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <VoorbereidenContent />
    </Suspense>
  )
}
