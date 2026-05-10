export default function TripsLoading() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6 sm:py-10" aria-busy="true">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-zinc-200" />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="h-10 w-full animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="h-10 animate-pulse rounded bg-zinc-200" />
            <div className="h-10 animate-pulse rounded bg-zinc-200" />
            <div className="h-10 animate-pulse rounded bg-zinc-200" />
            <div className="h-10 animate-pulse rounded bg-zinc-200" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="h-28 animate-pulse bg-zinc-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-48 animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
                  <div className="h-20 animate-pulse rounded bg-zinc-200" />
                  <div className="h-16 animate-pulse rounded bg-zinc-200" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="sr-only">Loading your trips</p>
      </div>
    </main>
  );
}
