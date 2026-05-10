import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { TripGroupSection } from "@/app/dashboard/trips/trip-group-section";
import { TripsControls } from "@/app/dashboard/trips/trips-controls";
import type { TripsQueryState, TripViewModel } from "@/app/dashboard/trips/types";
import {
  calculateDurationDays,
  formatDateRange,
  groupTripsByLifecycle,
  inferBookingProgress,
  inferLifecycleGroup,
  parseTripsQuery,
  resolveTripRole,
  sortTrips,
  toNumber,
} from "@/app/dashboard/trips/utils";

type TripsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getAccessWhere(currentUserId: string): Prisma.TripWhereInput {
  return {
    OR: [
      { ownerId: currentUserId },
      {
        members: {
          some: {
            userId: currentUserId,
          },
        },
      },
    ],
  };
}

function buildFilteredWhere(
  currentUserId: string,
  query: TripsQueryState
): Prisma.TripWhereInput {
  const andConditions: Prisma.TripWhereInput[] = [];

  if (query.q) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          stops: {
            some: {
              city: {
                name: {
                  contains: query.q,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ],
    });
  }

  if (query.status !== "all") {
    andConditions.push({ status: query.status });
  }

  if (query.visibility !== "all") {
    andConditions.push({ visibility: query.visibility });
  }

  if (query.role === "owner") {
    andConditions.push({ ownerId: currentUserId });
  }

  if (query.role === "editor") {
    andConditions.push({
      members: {
        some: {
          userId: currentUserId,
          role: "EDITOR",
        },
      },
    });
  }

  if (query.role === "viewer") {
    andConditions.push({
      members: {
        some: {
          userId: currentUserId,
          role: "VIEWER",
        },
      },
    });
  }

  const accessWhere = getAccessWhere(currentUserId);

  if (andConditions.length === 0) {
    return accessWhere;
  }

  return {
    ...accessWhere,
    AND: andConditions,
  };
}

function buildTripViewModels(
  trips: Awaited<ReturnType<typeof fetchTrips>>,
  currentUserId: string
): TripViewModel[] {
  return trips.map((trip) => {
    const membershipRole = trip.members[0]?.role;
    const role = resolveTripRole(trip.ownerId, currentUserId, membershipRole);

    const uniqueCityNames = Array.from(new Set(trip.stops.map((stop) => stop.city.name)));
    const uniqueCountryNames = Array.from(
      new Set(trip.stops.map((stop) => stop.city.country.name))
    );

    let destinationSummary = "No destinations yet";

    if (uniqueCityNames.length === 1) {
      destinationSummary = uniqueCityNames[0];
    } else if (uniqueCityNames.length === 2) {
      destinationSummary = `${uniqueCityNames[0]} & ${uniqueCityNames[1]}`;
    } else if (uniqueCityNames.length > 2) {
      destinationSummary = `${uniqueCityNames[0]}, ${uniqueCityNames[1]} +${
        uniqueCityNames.length - 2
      } more`;
    }

    const estimatedStopCost = trip.stops.reduce((sum, stop) => {
      return sum + toNumber(stop.estimatedCost);
    }, 0);

    const estimatedExpenseCost = trip.expenses
      .filter((expense) => expense.isEstimated)
      .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

    const actualExpenseCost = trip.expenses
      .filter((expense) => !expense.isEstimated)
      .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

    const estimatedSpend = estimatedStopCost + estimatedExpenseCost;
    const totalBudget = trip.totalBudget ? toNumber(trip.totalBudget) : null;

    const budgetReference = Math.max(actualExpenseCost, estimatedSpend);
    const budgetUsedPercent =
      totalBudget && totalBudget > 0 ? (budgetReference / totalBudget) * 100 : null;

    const stopsWithTransport = trip.stops.filter(
      (stop) => Boolean(stop.transportMode) || toNumber(stop.transportCost) > 0
    ).length;

    const receiptsCount = trip.expenses.filter((expense) => Boolean(expense.receiptUrl)).length;

    const booking = inferBookingProgress({
      stopCount: trip.stops.length,
      stopsWithTransport,
      estimatedSpend,
      actualSpend: actualExpenseCost,
      receiptsCount,
    });

    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      coverPhotoUrl: trip.coverPhotoUrl,
      status: trip.status,
      visibility: trip.visibility,
      role,
      lifecycle: inferLifecycleGroup(trip.status, trip.startDate, trip.endDate),
      destinationSummary,
      destinationPreview: uniqueCityNames.slice(0, 3),
      stopCount: trip._count.stops,
      countrySummary:
        uniqueCountryNames.length > 0 ? uniqueCountryNames.join(", ") : "No countries yet",
      startDate: trip.startDate,
      endDate: trip.endDate,
      dateLabel: formatDateRange(trip.startDate, trip.endDate),
      durationDays: calculateDurationDays(trip.startDate, trip.endDate),
      currency: trip.currency,
      totalBudget,
      estimatedSpend,
      actualSpend: actualExpenseCost,
      budgetUsedPercent,
      booking,
      meta: {
        updatedAt: trip.updatedAt,
        createdAt: trip.createdAt,
        copyCount: trip.copyCount,
        notesCount: trip._count.notes,
        shareLinkCount: trip._count.shareLinks,
        memberCount: trip._count.members,
      },
    } satisfies TripViewModel;
  });
}

async function fetchTrips(where: Prisma.TripWhereInput, currentUserId: string) {
  return db.trip.findMany({
    where,
    select: {
      id: true,
      ownerId: true,
      name: true,
      description: true,
      coverPhotoUrl: true,
      startDate: true,
      endDate: true,
      status: true,
      visibility: true,
      currency: true,
      totalBudget: true,
      copyCount: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: {
          userId: currentUserId,
        },
        select: {
          role: true,
        },
        take: 1,
      },
      stops: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          estimatedCost: true,
          transportMode: true,
          transportCost: true,
          city: {
            select: {
              name: true,
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      expenses: {
        select: {
          amount: true,
          isEstimated: true,
          receiptUrl: true,
        },
      },
      _count: {
        select: {
          stops: true,
          notes: true,
          members: true,
          shareLinks: true,
        },
      },
    },
  });
}

function HeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        Back to Dashboard
      </Link>
      <Link
        href="/dashboard/trips/new"
        className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        Create Trip
      </Link>
    </div>
  );
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const query = parseTripsQuery(resolvedSearchParams);

  const accessWhere = getAccessWhere(session.userId);
  const filteredWhere = buildFilteredWhere(session.userId, query);

  const [totalVisibleTrips, rawTrips] = await Promise.all([
    db.trip.count({ where: accessWhere }),
    fetchTrips(filteredWhere, session.userId),
  ]);

  const mappedTrips = buildTripViewModels(rawTrips, session.userId);
  const sortedTrips = sortTrips(mappedTrips, query.sort);
  const groupedTrips = groupTripsByLifecycle(sortedTrips);

  const noTripsAtAll = totalVisibleTrips === 0;
  const noMatches = !noTripsAtAll && sortedTrips.length === 0;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-700">Current User Trips</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-900 sm:text-3xl">
                Manage your trips in one place
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-base">
                Search, filter, and track the status of trips you own or collaborate on.
                Keep an eye on booking progress, budget usage, and key planning metadata.
              </p>
            </div>
            <HeaderActions />
          </div>
        </header>

        <TripsControls
          query={query}
          totalVisibleTrips={totalVisibleTrips}
          filteredTrips={sortedTrips.length}
        />

        {noTripsAtAll ? (
          <section
            aria-labelledby="empty-trips-title"
            className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm"
          >
            <h2 id="empty-trips-title" className="text-xl font-semibold text-zinc-900">
              No trips yet
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 sm:text-base">
              You haven&apos;t created or joined any trips yet. Start by creating your first
              trip itinerary.
            </p>
            <Link
              href="/dashboard/trips/new"
              className="mt-5 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              Create your first trip
            </Link>
          </section>
        ) : noMatches ? (
          <section
            aria-labelledby="empty-search-title"
            className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm"
          >
            <h2 id="empty-search-title" className="text-xl font-semibold text-zinc-900">
              No trips match your filters
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 sm:text-base">
              Try changing your search terms or filters to find matching trips.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/trips"
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                Clear Filters
              </Link>
              <Link
                href="/dashboard/trips/new"
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                Create Trip
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-8">
            <TripGroupSection
              title="Ongoing"
              description="Trips currently in progress or happening right now."
              trips={groupedTrips.ongoing}
              sectionId="trips-ongoing"
            />

            <TripGroupSection
              title="Upcoming"
              description="Trips planned for future dates."
              trips={groupedTrips.upcoming}
              sectionId="trips-upcoming"
            />

            <TripGroupSection
              title="Completed"
              description="Trips you have finished or archived."
              trips={groupedTrips.completed}
              sectionId="trips-completed"
            />
          </div>
        )}
      </div>
    </main>
  );
}
