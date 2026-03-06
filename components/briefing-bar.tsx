"use client"

import { usePathname, useRouter } from "next/navigation"
import { useBriefing } from "./briefing-context"

export function BriefingBar() {
  const { state, dismiss } = useBriefing()
  const pathname = usePathname()
  const router = useRouter()

  // Don't show bar if on the voorbereiden page itself, or if no briefing active
  if (!state || pathname === "/voorbereiden") return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <div
          onClick={() =>
            router.push(`/voorbereiden?topic=${encodeURIComponent(state.topic)}`)
          }
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary-30 bg-white px-4 py-3 shadow-lg transition-shadow hover:shadow-xl"
        >
          {state.loading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-30 border-t-primary" />
          ) : state.error ? (
            <span className="h-4 w-4 shrink-0 rounded-full bg-red-500" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full bg-green-500" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-primary">
              {state.loading
                ? "Briefing wordt gegenereerd..."
                : state.error
                  ? "Briefing mislukt"
                  : "Briefing klaar"}
            </p>
            <p className="truncate text-xs text-primary-75">{state.topic}</p>
          </div>

          {!state.loading && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                dismiss()
              }}
              className="shrink-0 text-primary-60 hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
