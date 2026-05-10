import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">
                Welcome, {session.username}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                You are signed in as {session.email}
              </p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        <section
          aria-labelledby="dashboard-next-steps"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <h2
            id="dashboard-next-steps"
            className="text-lg font-semibold text-zinc-900"
          >
            Continue planning
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            View all your current trips, track progress, and jump back into
            planning.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/trips"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Go to My Trips
            </Link>
            <Link
              href="/dashboard/trips/new"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Create New Trip
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
