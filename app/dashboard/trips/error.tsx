"use client";

import Link from "next/link";

export default function TripsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-red-700">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          We couldn&apos;t load your trips
        </h1>
        <p className="mt-3 text-sm text-zinc-600 sm:text-base">
          Please try again. If the issue continues, refresh the page or return to
          dashboard.
        </p>

        {error.digest ? (
          <p className="mt-3 rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-600">
            Error reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
