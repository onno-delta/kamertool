export default function BriefingsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-border-light/60" />

        {/* Header */}
        <section className="mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-border-light/60" />
            <div>
              <div className="h-8 w-56 animate-pulse rounded bg-border-light/60" />
              <div className="mt-2 h-4 w-80 animate-pulse rounded bg-border-light/60" />
            </div>
          </div>
        </section>

        {/* Search bar */}
        <div className="mb-6 rounded-xl border border-border-light bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="h-10 w-full animate-pulse rounded bg-border-light/60" />
        </div>

        {/* Card skeletons */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-border-light/60" />
          ))}
        </div>
      </div>
    </div>
  )
}
