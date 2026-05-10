import { logout } from "@/app/actions/auth";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12">
      <section className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
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
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6">
          <p className="text-sm text-zinc-700">
            Auth is now working. Next we can implement the trip creation and
            itinerary flows.
          </p>
        </div>
      </section>
    </main>
  );
}
