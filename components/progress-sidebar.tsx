"use client"

import { Activity, CheckCircle2 } from "lucide-react"

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
}

export function getStepLabel(tool: string, args: Record<string, unknown>): string {
  if (tool === "fetchWebPage" && args?.url) {
    try {
      return new URL(args.url as string).hostname.replace(/^www\./, "")
    } catch {
      return "Webpagina ophalen"
    }
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

// --- Phase grouping ---

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
  getDocumentText: "fetch",
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
}

function processPhases(
  steps: ToolStep[],
  isStreaming: boolean,
  hasAssistantText: boolean
): PhaseItem[] {
  // Group steps by phase
  const byPhase: Record<PhaseKey, ToolStep[]> = { search: [], fetch: [], summarize: [] }
  for (const step of steps) {
    const phase = TOOL_PHASE[step.tool]
    if (phase) byPhase[phase].push(step)
  }

  const phases: PhaseItem[] = []

  // Search phase
  if (byPhase.search.length > 0) {
    const anyRunning = byPhase.search.some((s) => s.status === "running")
    const allSettled = byPhase.search.every((s) => s.status === "done" || s.status === "error")
    const config = PHASE_CONFIG.search
    phases.push({
      key: "search",
      label: config.label,
      status: anyRunning ? "running" : allSettled ? "done" : "running",
      detail: allSettled ? config.doneLabel(byPhase.search.length) : undefined,
    })
  }

  // Fetch phase
  if (byPhase.fetch.length > 0) {
    const anyRunning = byPhase.fetch.some((s) => s.status === "running")
    const allSettled = byPhase.fetch.every((s) => s.status === "done" || s.status === "error")
    const config = PHASE_CONFIG.fetch
    phases.push({
      key: "fetch",
      label: config.label,
      status: anyRunning ? "running" : allSettled ? "done" : "running",
      detail: allSettled ? config.doneLabel(byPhase.fetch.length) : undefined,
    })
  }

  // Summarize phase: derived from streaming state
  const noRunningTools = steps.length > 0 && steps.every((s) => s.status === "done" || s.status === "error")
  if (isStreaming && noRunningTools && steps.length > 0) {
    phases.push({
      key: "summarize",
      label: PHASE_CONFIG.summarize.label,
      status: "running",
    })
  } else if (!isStreaming && steps.length > 0 && hasAssistantText) {
    phases.push({
      key: "summarize",
      label: PHASE_CONFIG.summarize.label,
      status: "done",
      detail: PHASE_CONFIG.summarize.doneLabel(0),
    })
  }

  return phases
}

type ProgressSidebarProps = {
  steps: ToolStep[]
  isStreaming?: boolean
  hasAssistantText?: boolean
}

export function ProgressSidebar({ steps, isStreaming = false, hasAssistantText = false }: ProgressSidebarProps) {
  if (steps.length === 0) return null

  const phases = processPhases(steps, isStreaming, hasAssistantText)
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
          /* Compact done state */
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
            {phases.map((phase, idx) => (
              <div
                key={phase.key}
                className={`flex items-start gap-2.5 py-2.5 animate-[fadeIn_0.3s_ease-out] ${idx > 0 ? "border-t border-border-light" : ""}`}
              >
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
