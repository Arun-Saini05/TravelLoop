import Link from "next/link";
import type { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { TripGroupSection } from "@/app/dashboard/trips/trip-group-section";
import { TripsControls } from "@/app/dashboard/trips/trips-controls";
import type { TripsQueryState, TripViewModel } from "@/app/dashboard/trips/types";
import {
  AppHeader,
  buttonClasses,
  Card,
  EmptyState,
  PageContainer,
} from "@/components/ui";
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
    <main className="min-h-screen bg-app">
      <AppHeader
        width="wide"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My trips" },
        ]}
        actions={
          <Link
            href="/trips/new"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            + Create trip
          </Link>
        }
      />

      <PageContainer width="wide">
        <Card padded className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            Your trips
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Manage every plan in one place
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Search, filter, and track the status of trips you own or collaborate on.
            Keep an eye on booking progress, budget usage, and key planning metadata.
          </p>
        </Card>

        <div className="mb-6">
          <TripsControls
            query={query}
            totalVisibleTrips={totalVisibleTrips}
            filteredTrips={sortedTrips.length}
          />
        </div>

        {noTripsAtAll ? (
          <EmptyState
            icon="🧭"
            title="No trips yet"
            description="You haven't created or joined any trips yet. Start by creating your first itinerary."
            action={
              <Link
                href="/trips/new"
                className={buttonClasses({ variant: "brand", size: "md" })}
              >
                + Create your first trip
              </Link>
            }
          />
        ) : noMatches ? (
          <EmptyState
            icon="🔍"
            title="No trips match your filters"
            description="Try changing your search terms or filters to find matching trips."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/dashboard/trips"
                  className={buttonClasses({ variant: "primary", size: "md" })}
                >
                  Clear filters
                </Link>
                <Link
                  href="/trips/new"
                  className={buttonClasses({ variant: "secondary", size: "md" })}
                >
                  + Create trip
                </Link>
              </div>
            }
          />
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
      </PageContainer>
    </main>
  );
}
