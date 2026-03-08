export default function InstructiesLoading() {
  return (
    <div className="mx-auto max-w-3xl overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-border-light/60" />

      {/* Header */}
      <section className="mb-8">
        <div className="h-10 w-40 animate-pulse rounded bg-border-light/60" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-border-light/60" />
      </section>

      {/* Accordion row skeletons */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-border-light/60" />
                <div className="h-4 w-36 animate-pulse rounded bg-border-light/60" />
              </div>
              <div className="h-4 w-4 animate-pulse rounded bg-border-light/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
