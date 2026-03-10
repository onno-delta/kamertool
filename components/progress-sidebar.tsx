"use client"

import { useState } from "react"
import { Activity, CheckCircle2, ChevronDown, Download } from "lucide-react"

export type Phase = {
  label: string
  status: "idle" | "running" | "done"
}

export type ToolStep = {
  id: string
  tool: string
  label: string
  status: "running" | "done" | "error"
  detail?: string
}

const TOOL_LABELS: Record<string, string> = {
  searchKamerstukken: "Kamerstukken",
  searchHandelingen: "Handelingen",
  searchToezeggingen: "Toezeggingen",
  searchStemmingen: "Stemmingen",
  searchNews: "Nieuws",
  fetchWebPage: "Webpagina",
  searchAgenda: "Kameragenda",
  searchDocumenten: "Documenten",
  searchPartyDocs: "Partijdocumenten",
  searchParlement: "Parlementaire documenten",
  getDocumentText: "Document ophalen",
  getRecenteKamervragen: "Recente Kamervragen",
  searchOpenTK: "OpenTK zoeken",
  getOpenTKDocument: "OpenTK document",
  searchExa: "Social zoeken",
}

export function getStepLabel(tool: string, args: Record<string, unknown>): string {
  if (tool === "fetchWebPage" && args?.url) {
    try {
      return new URL(args.url as string).hostname.replace(/^www\./, "")
    } catch {
      return "Webpagina ophalen"
    }
  }
  if (tool === "searchExa") {
    const scopeLabels: Record<string, string> = { twitter: "X/Twitter", linkedin: "LinkedIn" }
    const base = scopeLabels[(args?.scope as string)] ?? "Social"
    const query = args?.query as string | undefined
    return query ? `${base}: "${query}"` : base
  }
  const base = TOOL_LABELS[tool] ?? tool
  const query = args?.query as string | undefined
  return query ? `${base}: "${query}"` : base
}

export function getStepDetail(
  tool: string,
  status: string,
  output: Record<string, unknown> | undefined
): string | undefined {
  if (status === "output-error" || status === "error") return "mislukt"
  if (status !== "output-available" && status !== "done") return undefined
  if (tool === "fetchWebPage") return "opgehaald"
  const count =
    (output?.count as number) ?? (output?.results as unknown[] | undefined)?.length
  if (count !== undefined) return `${count} resultaten`
  return undefined
}

// --- Phase grouping for chat mode (old ToolStep-based) ---

type PhaseKey = "search" | "fetch" | "summarize"

const TOOL_PHASE: Record<string, PhaseKey> = {
  searchParlement: "search",
  searchKamerstukken: "search",
  searchHandelingen: "search",
  searchToezeggingen: "search",
  searchStemmingen: "search",
  searchAgenda: "search",
  searchDocumenten: "search",
  searchPartyDocs: "search",
  searchNews: "search",
  getRecenteKamervragen: "search",
  searchOpenTK: "search",
  searchExa: "search",
  getDocumentText: "fetch",
  getOpenTKDocument: "fetch",
  fetchWebPage: "fetch",
}

const PHASE_CONFIG: Record<PhaseKey, {
  label: string
  doneLabel: (count: number) => string
}> = {
  search: {
    label: "Bronnen zoeken",
    doneLabel: (n) => `${n} ${n === 1 ? "bron" : "bronnen"} doorzocht`,
  },
  fetch: {
    label: "Documenten lezen",
    doneLabel: (n) => `${n} ${n === 1 ? "document" : "documenten"} gelezen`,
  },
  summarize: {
    label: "Antwoord schrijven",
    doneLabel: () => "Antwoord geschreven",
  },
}

type PhaseItem = {
  key: PhaseKey
  label: string
  detail?: string
  status: "running" | "done" | "idle"
  steps: ToolStep[]
}

const PREVIEW_COUNT = 3

function processToolPhases(
  steps: ToolStep[],
  isStreaming: boolean,
  hasAssistantText: boolean
): PhaseItem[] {
  const byPhase: Record<PhaseKey, ToolStep[]> = { search: [], fetch: [], summarize: [] }
  for (const step of steps) {
    const phase = TOOL_PHASE[step.tool]
    if (phase) byPhase[phase].push(step)
  }

  const phases: PhaseItem[] = []

  if (byPhase.search.length > 0) {
    const anyRunning = byPhase.search.some((s) => s.status === "running")
    const allSettled = byPhase.search.every((s) => s.status === "done" || s.status === "error")
    const config = PHASE_CONFIG.search
    phases.push({
      key: "search",
      label: config.label,
      status: anyRunning ? "running" : allSettled ? "done" : "running",
      detail: allSettled ? config.doneLabel(byPhase.search.length) : undefined,
      steps: byPhase.search,
    })
  }

  if (byPhase.fetch.length > 0) {
    const anyRunning = byPhase.fetch.some((s) => s.status === "running")
    const allSettled = byPhase.fetch.every((s) => s.status === "done" || s.status === "error")
    const config = PHASE_CONFIG.fetch
    phases.push({
      key: "fetch",
      label: config.label,
      status: anyRunning ? "running" : allSettled ? "done" : "running",
      detail: allSettled ? config.doneLabel(byPhase.fetch.length) : undefined,
      steps: byPhase.fetch,
    })
  }

  const noRunningTools = steps.length > 0 && steps.every((s) => s.status === "done" || s.status === "error")
  if (isStreaming && noRunningTools && steps.length > 0) {
    phases.push({
      key: "summarize",
      label: PHASE_CONFIG.summarize.label,
      status: "running",
      steps: [],
    })
  } else if (!isStreaming && steps.length > 0 && hasAssistantText) {
    phases.push({
      key: "summarize",
      label: PHASE_CONFIG.summarize.label,
      status: "done",
      detail: PHASE_CONFIG.summarize.doneLabel(0),
      steps: [],
    })
  }

  return phases
}

// --- Component ---

type ProgressSidebarProps = {
  // Briefing mode: deliverable phases from meeting skill
  phases?: Phase[]
  toolCount?: number
  // Chat mode: tool steps grouped into phases
  steps?: ToolStep[]
  // Shared
  isStreaming?: boolean
  hasAssistantText?: boolean
  // PDF download (shown when briefing is complete)
  onDownloadPDF?: () => void
  pdfBusy?: boolean
}

export function ProgressSidebar({ phases, toolCount = 0, steps, isStreaming = false, hasAssistantText = false, onDownloadPDF, pdfBusy }: ProgressSidebarProps) {
  // Briefing mode: show deliverable phases
  if (phases && phases.length > 0) {
    return <BriefingProgress phases={phases} isStreaming={isStreaming} toolCount={toolCount} onDownloadPDF={onDownloadPDF} pdfBusy={pdfBusy} />
  }

  // Chat mode: show tool-grouped phases
  if (steps && steps.length > 0) {
    return <ChatProgress steps={steps} isStreaming={isStreaming} hasAssistantText={hasAssistantText} />
  }

  return null
}

function BriefingProgress({ phases, isStreaming, toolCount, onDownloadPDF, pdfBusy }: { phases: Phase[]; isStreaming: boolean; toolCount: number; onDownloadPDF?: () => void; pdfBusy?: boolean }) {
  const doneCount = phases.filter((p) => p.status === "done").length
  const totalCount = phases.length
  const allDone = totalCount > 0 && doneCount === totalCount && !isStreaming

  return (
    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="rounded-xl border border-border-light bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="mb-3.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.075em] text-text-muted">
          {allDone ? (
            <CheckCircle2 className="h-[13px] w-[13px] text-green-600" />
          ) : (
            <Activity className="h-[13px] w-[13px]" />
          )}
          Voortgang
          <span className="ml-auto text-[0.625rem] font-medium normal-case tracking-normal">
            {doneCount}/{totalCount}
          </span>
        </h3>

        {allDone ? (
          <div>
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <svg className="h-[11px] w-[11px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-[0.8125rem] font-medium text-green-800">
                Briefing compleet
              </span>
            </div>
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                disabled={pdfBusy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-surface-muted disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {pdfBusy ? "Bezig..." : "Download PDF"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {phases.map((phase, idx) => (
              <div
                key={phase.label}
                className={`py-2.5 animate-[fadeIn_0.3s_ease-out] ${idx > 0 ? "border-t border-border-light" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {phase.status === "running" ? (
                      <span className="block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                    ) : phase.status === "done" ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-[11px] w-[11px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[0.8125rem] font-medium ${
                      phase.status === "running" ? "text-primary"
                        : phase.status === "done" ? "text-text-muted"
                        : "text-text-muted/60"
                    }`}>
                      {phase.label}
                    </p>
                    {phase.status === "running" && toolCount > 0 && idx === phases.findIndex((p) => p.status === "running") && (
                      <p className="text-xs text-text-muted">{toolCount} {toolCount === 1 ? "bron" : "bronnen"} doorzocht</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatProgress({ steps, isStreaming, hasAssistantText }: { steps: ToolStep[]; isStreaming: boolean; hasAssistantText: boolean }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const phases = processToolPhases(steps, isStreaming, hasAssistantText)
  if (phases.length === 0) return null

  const doneCount = phases.filter((p) => p.status === "done").length
  const totalCount = phases.length
  const allDone = doneCount === totalCount && !phases.some((p) => p.status === "running")

  return (
    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="rounded-xl border border-border-light bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="mb-3.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.075em] text-text-muted">
          {allDone ? (
            <CheckCircle2 className="h-[13px] w-[13px] text-green-600" />
          ) : (
            <Activity className="h-[13px] w-[13px]" />
          )}
          Voortgang
          <span className="ml-auto text-[0.625rem] font-medium normal-case tracking-normal">
            {doneCount}/{totalCount}
          </span>
        </h3>

        {allDone ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <svg className="h-[11px] w-[11px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-[0.8125rem] font-medium text-green-800">
              Onderzoek afgerond
            </span>
          </div>
        ) : (
          <div className="space-y-0">
            {phases.map((phase, idx) => {
              const isExpanded = !!expanded[phase.key]
              const hasSubSteps = phase.steps.length > 0
              const visibleSteps = isExpanded ? phase.steps : phase.steps.slice(0, PREVIEW_COUNT)
              const hiddenCount = phase.steps.length - PREVIEW_COUNT

              return (
                <div
                  key={phase.key}
                  className={`py-2.5 animate-[fadeIn_0.3s_ease-out] ${idx > 0 ? "border-t border-border-light" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {phase.status === "running" ? (
                        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                      ) : phase.status === "done" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                          <svg className="h-[11px] w-[11px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[0.8125rem] font-medium ${
                        phase.status === "running" ? "text-primary" : "text-text-muted"
                      }`}>
                        {phase.label}
                      </p>
                      {phase.detail && (
                        <p className="text-xs text-text-muted">{phase.detail}</p>
                      )}
                    </div>
                  </div>

                  {hasSubSteps && (
                    <div className="ml-[30px] mt-1.5">
                      {visibleSteps.map((step) => (
                        <div key={step.id} className="flex items-center gap-1.5 py-0.5">
                          {step.status === "running" ? (
                            <span className="block h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-border border-t-primary" />
                          ) : step.status === "error" ? (
                            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-red-100">
                              <svg className="h-1.5 w-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </span>
                          ) : (
                            <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-green-100">
                              <svg className="h-2 w-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                          <span className="truncate text-[0.6875rem] text-text-muted">
                            {step.label}
                          </span>
                          {step.detail && (
                            <span className="shrink-0 text-[0.625rem] text-text-muted/60">
                              {step.detail}
                            </span>
                          )}
                        </div>
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [phase.key]: !prev[phase.key] }))}
                          className="mt-0.5 flex items-center gap-0.5 text-[0.6875rem] text-text-muted hover:text-primary"
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          {isExpanded ? "Minder tonen" : `${hiddenCount} meer`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
