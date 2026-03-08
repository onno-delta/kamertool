export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-border-light/60" />

      {/* Header */}
      <section className="mb-6">
        <div className="h-10 w-56 animate-pulse rounded bg-border-light/60" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-border-light/60" />
      </section>

      {/* Members card */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-border-light/60" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-border-light/60" />
          ))}
        </div>
      </div>

      {/* Documents card */}
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="mb-4 h-5 w-28 animate-pulse rounded bg-border-light/60" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-border-light/60" />
          ))}
        </div>
      </div>
    </div>
  )
}
