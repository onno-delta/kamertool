"use client"

import { Activity } from "lucide-react"

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

type DisplayItem = {
  key: string
  tool: string
  label: string
  detail?: string
  status: "running" | "done" | "error"
  count: number
}

function processSteps(steps: ToolStep[]): DisplayItem[] {
  // Group consecutive same-tool completed fetchWebPage calls
  const grouped: DisplayItem[] = []
  for (const step of steps) {
    const last = grouped[grouped.length - 1]
    if (
      last &&
      last.status === "done" &&
      step.status === "done" &&
      step.tool === "fetchWebPage" &&
      last.tool === "fetchWebPage"
    ) {
      last.count++
      last.label = last.label.split(" ")[0]
      last.detail = `${last.count}x opgehaald`
      last.key += `-${step.id}`
      continue
    }
    grouped.push({
      key: step.id,
      tool: step.tool,
      label: step.label,
      detail: step.detail,
      status: step.status,
      count: 1,
    })
  }

  return grouped
}

export function ProgressSidebar({ steps }: { steps: ToolStep[] }) {
  if (steps.length === 0) return null

  const items = processSteps(steps)
  if (items.length === 0) return null

  return (
    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="rounded-xl border border-border-light bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="mb-3.5 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.075em] text-text-muted">
          <Activity className="h-[13px] w-[13px]" />
          Voortgang
        </h3>
        <div className="space-y-0">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={`flex items-start gap-2.5 py-2.5 animate-[fadeIn_0.3s_ease-out] ${idx > 0 ? "border-t border-border-light" : ""}`}
            >
              <div className="mt-0.5 shrink-0">
                {item.status === "running" ? (
                  <span className="block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                ) : item.status === "error" ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-2.5 w-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-[11px] w-[11px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-primary">{item.label}</p>
                {item.detail && (
                  <p className="truncate text-xs text-text-muted">{item.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
