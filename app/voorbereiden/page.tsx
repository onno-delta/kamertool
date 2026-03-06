"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { useBriefing } from "@/components/briefing-context"
import { ProgressSidebar } from "@/components/progress-sidebar"

function VoorbereidenContent() {
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic") ?? ""
  const soort = searchParams.get("soort") ?? undefined
  const { state, startBriefing, downloadPDF } = useBriefing()

  // Start briefing if topic is set and no matching briefing is running/done
  useEffect(() => {
    if (!topic) return
    if (state?.topic === topic) return
    startBriefing(topic, soort)
  }, [topic, soort, state?.topic, startBriefing])

  if (!topic) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-primary-75">Geen onderwerp opgegeven.</p>
          <Link href="/agenda" className="mt-2 inline-block text-sm text-primary hover:underline">
            Terug naar agenda
          </Link>
        </div>
      </div>
    )
  }

  const loading = state?.topic === topic && state.loading
  const content = state?.topic === topic ? state.content : null
  const error = state?.topic === topic ? state.error : null
  const partyName = state?.topic === topic ? state.partyName : null
  const steps = state?.topic === topic ? state.steps : []

  return (
    <div className="flex min-h-0 flex-1 gap-6 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto max-w-3xl px-0 py-2 sm:py-3">
          <Link href="/agenda" className="mb-3 inline-block text-sm text-primary-75 hover:text-primary">
            &larr; Terug naar agenda
          </Link>

          <section className="rounded-xl border border-primary-30 bg-white/95 px-6 py-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-primary">{topic}</h1>
            {partyName && (
              <p className="mt-1 text-sm text-primary-75">
                Briefing gericht op: {partyName}
              </p>
            )}

            {loading && (
              <div className="mt-6 rounded-xl border border-primary-30 bg-primary-15/40 px-6 py-6">
                <div className="flex flex-col items-center gap-4">
                  <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary-15 border-t-primary" />
                  <div className="text-center">
                    <p className="font-medium text-primary">Briefing wordt gegenereerd...</p>
                    <p className="mt-1 text-sm text-primary-75">
                      De PDF wordt automatisch gedownload zodra hij klaar is.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-6 py-4">
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
      <div className="hidden min-h-0 lg:block">
        {steps.length > 0 && <ProgressSidebar steps={steps} />}
      </div>
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
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary-30 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-15">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                briefing-{topic.slice(0, 30).replace(/\s+/g, "-")}.pdf
              </p>
              <p className="text-xs text-primary-75">
                Gegenereerd op {new Date().toLocaleDateString("nl-NL")}
                {partyName && <> — {partyName}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="rounded-lg border border-primary-30 bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
            >
              Download PDF
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="rounded-lg border border-primary-30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-15"
            >
              Kopieer tekst
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-30 bg-white shadow-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-sm font-medium text-primary">Briefing bekijken</span>
          <span className="text-xs text-primary-75">{expanded ? "Inklappen" : "Uitklappen"}</span>
        </button>
        {expanded && (
          <div className="border-t border-primary-15 px-6 py-4">
            <div className="prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
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
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-30 border-t-primary" />
        </div>
      }
    >
      <VoorbereidenContent />
    </Suspense>
  )
}
