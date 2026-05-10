import Link from "next/link";
import { requireSession } from "@/lib/session";
import { NewTripForm } from "@/app/trips/new/new-trip-form";

export default async function NewTripPage() {
  await requireSession();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Plan a new trip</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Create your trip with dates, destination, and activity inspiration.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Back
          </Link>
        </div>

        <NewTripForm />
      </section>
    </main>
  );
}
