import Link from "next/link";
import { requireSession } from "@/lib/session";

export default async function NewTripPage() {
  await requireSession();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-teal-700">Create Trip</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Trip creation flow is next
        </h1>
        <p className="mt-3 text-sm text-zinc-600 sm:text-base">
          This route is ready for the full create-trip form. You can return to your
          trip listing while creation is being implemented.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/trips"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Back to My Trips
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
