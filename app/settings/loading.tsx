export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-border-light/60" />

      {/* Header */}
      <section className="mb-8">
        <div className="h-10 w-48 animate-pulse rounded bg-border-light/60" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-border-light/60" />
      </section>

      {/* Party card */}
      <div className="mb-5 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-border-light/60" />
          <div className="h-4 w-16 animate-pulse rounded bg-border-light/60" />
        </div>
        <div className="px-5 py-5">
          <div className="h-4 w-32 animate-pulse rounded bg-border-light/60" />
          <div className="mt-3 h-8 w-28 animate-pulse rounded bg-border-light/60" />
        </div>
      </div>

      {/* Dossiers card */}
      <div className="mb-5 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-border-light/60" />
          <div className="h-4 w-20 animate-pulse rounded bg-border-light/60" />
        </div>
        <div className="px-5 py-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-border-light/60" />
            ))}
          </div>
        </div>
      </div>

      {/* Kamerleden card */}
      <div className="mb-8 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-border-light/60" />
          <div className="h-4 w-36 animate-pulse rounded bg-border-light/60" />
        </div>
        <div className="px-5 py-5">
          <div className="h-10 w-full animate-pulse rounded-lg bg-border-light/60" />
        </div>
      </div>
    </div>
  )
}
