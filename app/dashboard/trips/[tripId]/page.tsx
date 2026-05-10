import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { humanizeEnum } from "@/app/dashboard/trips/utils";

type TripDetailPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const session = await requireSession();
  const { tripId } = await params;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { ownerId: session.userId },
        {
          members: {
            some: {
              userId: session.userId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      visibility: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          stops: true,
          expenses: true,
          notes: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const tripData = trip as NonNullable<typeof trip>;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-teal-700">Trip Overview</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{tripData.name}</h1>

        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          {tripData.description || "No description has been added for this trip yet."}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-zinc-500">Dates</dt>
            <dd className="mt-1 text-zinc-900">
              {formatDate(tripData.startDate)} — {formatDate(tripData.endDate)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Status</dt>
            <dd className="mt-1 text-zinc-900">{humanizeEnum(tripData.status)}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Visibility</dt>
            <dd className="mt-1 text-zinc-900">{humanizeEnum(tripData.visibility)}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Stops</dt>
            <dd className="mt-1 text-zinc-900">{tripData._count.stops}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Expenses</dt>
            <dd className="mt-1 text-zinc-900">{tripData._count.expenses}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Notes</dt>
            <dd className="mt-1 text-zinc-900">{tripData._count.notes}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
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
