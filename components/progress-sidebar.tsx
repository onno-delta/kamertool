"use client"

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

export function ProgressSidebar({ steps }: { steps: ToolStep[] }) {
  if (steps.length === 0) return null

  return (
    <div className="sticky top-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Voortgang
        </h3>
        <div className="space-y-2.5">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {step.status === "running" ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
                ) : step.status === "error" ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-2.5 w-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-2.5 w-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-700">{step.label}</p>
                {step.detail && (
                  <p className="truncate text-xs text-gray-400">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
