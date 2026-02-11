export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-16 rounded-md bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="h-10 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </header>

      {/* KPI cards skeleton */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-8 w-28 rounded-lg bg-slate-200 animate-pulse" />
            {i === 1 && <div className="mt-2 h-4 w-36 rounded bg-slate-100 animate-pulse" />}
          </div>
        ))}
      </section>

      {/* Gráfico principal skeleton */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-[320px] w-full rounded-lg bg-slate-100 animate-pulse" />
      </section>

      {/* Gráficos secundários skeleton */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-44 rounded-lg bg-slate-200 animate-pulse" />
          <div className="mx-auto h-[260px] w-full max-w-[280px] rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-56 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-[260px] w-full space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 flex-1 rounded bg-slate-200 animate-pulse" style={{ width: `${60 + (i % 3) * 10}%` }} />
                <div className="h-4 w-12 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabelas skeleton */}
      <section className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((block) => (
          <div key={block} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="max-h-[280px] space-y-2 p-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-16 rounded bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 px-4 py-2 text-right">
              <div className="ml-auto h-4 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </section>

      {/* Links skeleton */}
      <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-4">
        <div className="h-10 w-28 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
