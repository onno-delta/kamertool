"use client"

import { useState, useEffect, useRef } from "react"
import { Globe, FileText, Newspaper, BookOpen, ChevronRight, Search } from "lucide-react"
import { getStepLabel, getStepDetail } from "./progress-sidebar"

type InlineToolStepProps = {
  toolName: string
  state: string
  input: Record<string, unknown>
  output?: unknown
}

const TOOL_ICONS: Record<string, typeof Globe> = {
  searchParlement: Globe,
  searchKamerstukken: Globe,
  searchHandelingen: Globe,
  searchToezeggingen: Globe,
  searchStemmingen: Globe,
  searchAgenda: Globe,
  searchDocumenten: Globe,
  getRecenteKamervragen: Globe,
  searchOpenTK: Globe,
  getOpenTKDocument: FileText,
  searchNews: Newspaper,
  searchPartyDocs: BookOpen,
  fetchWebPage: FileText,
  getDocumentText: FileText,
  searchExa: Search,
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${s}s`
}

function ResultsList({ output }: { output: unknown }) {
  if (!output || typeof output !== "object") return null
  const out = output as Record<string, unknown>
  const results = out.results as { title?: string; url?: string; source?: string }[] | undefined
  if (!results || results.length === 0) return null

  return (
    <div className="mt-1.5 space-y-0 border-l-2 border-border-light pl-3 animate-[collapseIn_0.2s_ease-out]">
      {results.slice(0, 6).map((r, i) => {
        const isLast = i === Math.min(results.length, 6) - 1
        let hostname = ""
        if (r.url) {
          try {
            hostname = new URL(r.url).hostname.replace(/^www\./, "")
          } catch { /* ignore */ }
        }
        return (
          <div key={i} className="flex items-baseline gap-1.5 py-0.5 text-xs text-text-muted">
            <span className="shrink-0 text-border">{isLast ? "└" : "├"}─</span>
            <span className="min-w-0 truncate">{r.title || "Document"}</span>
            {hostname && (
              <span className="shrink-0 text-[0.6875rem] text-primary-60">{hostname}</span>
            )}
          </div>
        )
      })}
      {results.length > 6 && (
        <div className="py-0.5 text-[0.6875rem] text-text-muted">
          … en {results.length - 6} meer
        </div>
      )}
    </div>
  )
}

export function InlineToolStep({ toolName, state, input, output }: InlineToolStepProps) {
  const [expanded, setExpanded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)

  const isDone = state === "output-available"
  const isError = state === "output-error"
  const isRunning = !isDone && !isError

  useEffect(() => {
    if (!isRunning) return
    if (!startRef.current) startRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current!)
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Freeze elapsed when done
  useEffect(() => {
    if (isDone || isError) {
      if (startRef.current) {
        setElapsed(Date.now() - startRef.current)
      }
    }
  }, [isDone, isError])

  const Icon = TOOL_ICONS[toolName] ?? Globe
  const label = getStepLabel(toolName, input)
  const detail = getStepDetail(
    toolName,
    isDone ? "done" : isError ? "error" : "running",
    output as Record<string, unknown> | undefined
  )

  const hasResults = !!(
    output &&
    typeof output === "object" &&
    Array.isArray((output as Record<string, unknown>).results) &&
    ((output as Record<string, unknown>).results as unknown[]).length > 0
  )

  return (
    <div className={`animate-[fadeIn_0.3s_ease-out] rounded-lg border px-3 py-2 ${
      isRunning
        ? "border-primary-30 bg-primary-15/30"
        : "border-border-light bg-surface-muted/50"
    }`}>
      <div
        className={`flex items-center gap-2 ${hasResults ? "cursor-pointer" : ""}`}
        onClick={() => hasResults && setExpanded(!expanded)}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isRunning ? "text-primary" : "text-text-muted"}`} />
        <span className={`min-w-0 flex-1 truncate text-[0.8125rem] ${
          isRunning ? "font-medium text-primary" : "text-text-muted"
        }`}>
          {label}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {isRunning && elapsed > 0 && (
            <span className="text-xs text-text-muted">{formatElapsed(elapsed)}</span>
          )}
          {isRunning ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-[1.5px] border-border border-t-primary" />
          ) : isError ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100">
              <svg className="h-2 w-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
              <svg className="h-[9px] w-[9px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          {detail && (
            <span className={`text-xs ${isError ? "text-red-500" : "text-text-muted"}`}>{detail}</span>
          )}
          {hasResults && (
            <ChevronRight className={`h-3.5 w-3.5 text-text-muted transition-transform ${expanded ? "rotate-90" : ""}`} />
          )}
        </span>
      </div>
      {expanded && hasResults && <ResultsList output={output} />}
    </div>
  )
}
