import { requireSession } from "@/lib/session";
import { NewTripForm } from "@/app/trips/new/new-trip-form";
import {
  AppHeader,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  PageContainer,
} from "@/components/ui";

export default async function NewTripPage() {
  await requireSession();

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="narrow"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My trips", href: "/dashboard/trips" },
          { label: "New trip" },
        ]}
      />

      <PageContainer width="narrow">
        <Card padded className="sm:p-8">
          <CardHeader>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                Step 1 of 3
              </p>
              <CardTitle className="mt-1 text-2xl tracking-tight">
                Plan a new trip
              </CardTitle>
              <CardDescription>
                Give your trip a name and dates. You&apos;ll add destinations next.
              </CardDescription>
            </div>
          </CardHeader>

          <div className="mt-6">
            <NewTripForm />
          </div>
        </Card>

        {/* Progress hint */}
        <ol className="mx-auto mt-6 flex w-full max-w-md items-center justify-between text-[11px] font-medium text-zinc-500">
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              1
            </span>
            <span className="text-zinc-900">Trip basics</span>
          </li>
          <li aria-hidden className="mx-2 h-px flex-1 bg-zinc-200" />
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-500">
              2
            </span>
            <span>Add stops</span>
          </li>
          <li aria-hidden className="mx-2 h-px flex-1 bg-zinc-200" />
          <li className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-500">
              3
            </span>
            <span>Activities</span>
          </li>
        </ol>
      </PageContainer>
    </main>
  );
}
