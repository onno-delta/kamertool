export default function VoorbereidenLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-0 py-2 sm:py-3">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-border-light/60" />

      {/* Form skeleton */}
      <section className="rounded-lg border border-border bg-white px-6 py-6">
        <div className="h-7 w-64 animate-pulse rounded bg-border-light/60" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-border-light/60" />

        <div className="mt-6 rounded-lg border border-border-light bg-surface-muted px-6 py-6">
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 h-4 w-28 animate-pulse rounded bg-border-light/60" />
              <div className="mb-2 h-3 w-72 animate-pulse rounded bg-border-light/60" />
              <div className="h-8 w-24 animate-pulse rounded bg-border-light/60" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-9 w-36 animate-pulse rounded bg-border-light/60" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
