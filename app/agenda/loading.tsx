export default function AgendaLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <section className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-border-light/60" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-border-light/60" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-border-light/60" />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="shrink-0 rounded-xl border border-border-light bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-border-light/60" />
          <div className="h-8 w-28 animate-pulse rounded bg-border-light/60" />
          <div className="h-8 w-52 animate-pulse rounded bg-border-light/60" />
          <div className="ml-auto h-8 w-52 animate-pulse rounded bg-border-light/60" />
        </div>
      </div>

      {/* Agenda list skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="space-y-6 py-4">
            {[0, 1, 2].map((g) => (
              <div key={g} className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-border-light" />
                {[0, 1].map((c) => (
                  <div key={c} className="h-20 animate-pulse rounded-xl bg-border-light/60" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
