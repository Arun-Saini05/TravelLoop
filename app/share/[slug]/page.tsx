import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { ActivityType } from "@/app/generated/prisma";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  EmptyState,
  PageContainer,
  Section,
  StatTile,
} from "@/components/ui";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const ACTIVITY_TYPE_META: Record<
  ActivityType | "OTHER",
  { emoji: string; label: string }
> = {
  SIGHTSEEING: { emoji: "🏛️", label: "Sightseeing" },
  FOOD: { emoji: "🍽️", label: "Food" },
  ADVENTURE: { emoji: "🧗", label: "Adventure" },
  CULTURE: { emoji: "🎭", label: "Culture" },
  NATURE: { emoji: "🌿", label: "Nature" },
  NIGHTLIFE: { emoji: "🌃", label: "Nightlife" },
  SHOPPING: { emoji: "🛍️", label: "Shopping" },
  WELLNESS: { emoji: "🧘", label: "Wellness" },
  TRANSPORT: { emoji: "🚂", label: "Transport" },
  OTHER: { emoji: "📌", label: "Other" },
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoDayKey(d: Date): string {
  return startOfDayUTC(d).toISOString().slice(0, 10);
}

function dayCount(start: Date, end: Date): number {
  const a = startOfDayUTC(start).getTime();
  const b = startOfDayUTC(end).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function PublicSharePage({ params }: PageProps) {
  const { slug } = await params;

  const link = await db.tripShareLink.findUnique({
    where: { slug },
    select: {
      id: true,
      tripId: true,
      isPublic: true,
      allowCopy: true,
      expiresAt: true,
      createdBy: {
        select: { firstName: true, lastName: true, username: true },
      },
    },
  });

  if (!link || !link.isPublic) {
    notFound();
  }

  const isExpired =
    link.expiresAt != null && link.expiresAt.getTime() < Date.now();

  // Always increment visit count, even on expired view, so owners can see
  // engagement on stale links.
  await db.tripShareLink.update({
    where: { id: link.id },
    data: { visitCount: { increment: 1 } },
  });

  if (isExpired) {
    return <ExpiredView />;
  }

  const trip = await db.trip.findUnique({
    where: { id: link.tripId },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      currency: true,
      coverPhotoUrl: true,
      visibility: true,
      stops: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          sortOrder: true,
          city: {
            select: {
              id: true,
              name: true,
              country: { select: { name: true } },
            },
          },
          activities: {
            orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              scheduledDate: true,
              startTime: true,
              estimatedCost: true,
              notes: true,
              activity: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  description: true,
                  durationMinutes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trip) notFound();

  type DaySlot = {
    dayKey: string;
    date: Date;
    dayNumber: number;
    stop: (typeof trip.stops)[number] | null;
    activities: Array<{
      id: string;
      name: string;
      type: ActivityType;
      cost: number | null;
      notes: string | null;
    }>;
  };

  const totalDays = dayCount(trip.startDate, trip.endDate);
  const days: DaySlot[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(
      startOfDayUTC(trip.startDate).getTime() + i * 86_400_000
    );
    days.push({
      dayKey: isoDayKey(date),
      date,
      dayNumber: i + 1,
      stop: null,
      activities: [],
    });
  }

  const dayByKey = new Map(days.map((d) => [d.dayKey, d]));

  for (const stop of trip.stops) {
    const stopStart = startOfDayUTC(stop.startDate).getTime();
    const stopEnd = startOfDayUTC(stop.endDate).getTime();
    for (const slot of days) {
      const t = startOfDayUTC(slot.date).getTime();
      if (t >= stopStart && t <= stopEnd && slot.stop == null) {
        slot.stop = stop;
      }
    }

    for (const a of stop.activities) {
      const fallback = stop.startDate;
      const when = a.scheduledDate ?? fallback;
      const key = isoDayKey(when);
      const slot = dayByKey.get(key);
      if (!slot) continue;
      slot.activities.push({
        id: a.id,
        name: a.activity.name,
        type: a.activity.type,
        cost: a.estimatedCost != null ? Number(a.estimatedCost) : null,
        notes: a.notes,
      });
    }
  }

  const allActivities = trip.stops.flatMap((s) => s.activities);
  const totalCost = allActivities.reduce(
    (sum, a) =>
      sum + (a.estimatedCost != null ? Number(a.estimatedCost) : 0),
    0
  );
  const totalActivities = allActivities.length;
  const plannedDays = days.filter((d) => d.activities.length > 0).length;

  const byType = new Map<ActivityType, { count: number; total: number }>();
  for (const stop of trip.stops) {
    for (const a of stop.activities) {
      const cur = byType.get(a.activity.type) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += a.estimatedCost != null ? Number(a.estimatedCost) : 0;
      byType.set(a.activity.type, cur);
    }
  }
  const breakdown = Array.from(byType.entries())
    .map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => b.total - a.total);

  const currency = trip.currency;

  const sharedByName =
    [link.createdBy.firstName, link.createdBy.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || link.createdBy.username;

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="default"
        actions={
          <Badge tone="brand" size="sm">
            Shared
          </Badge>
        }
      />

      <PageContainer width="default">
        {/* Hero */}
        <Card padded className="mb-6 overflow-hidden p-0">
          <div
            className="h-32 w-full sm:h-40"
            style={
              trip.coverPhotoUrl
                ? {
                    backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.55), rgba(15,23,42,0.15)), url(${trip.coverPhotoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    backgroundImage:
                      "linear-gradient(135deg,#0f766e 0%,#14b8a6 60%,#06b6d4 100%)",
                  }
            }
            aria-hidden="true"
          />
          <div className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Shared itinerary
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {trip.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {fmtLong(trip.startDate)} → {fmtLong(trip.endDate)}
              <span className="mx-2 text-zinc-300">·</span>
              {totalDays} day{totalDays === 1 ? "" : "s"}
              <span className="mx-2 text-zinc-300">·</span>
              {trip.stops.length} stop{trip.stops.length === 1 ? "" : "s"}
            </p>
            {trip.description && (
              <p className="mt-3 max-w-2xl text-sm text-zinc-700">
                {trip.description}
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Shared by <span className="font-medium text-zinc-700">{sharedByName}</span>
            </p>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatTile eyebrow="Activities" value={totalActivities} />
          <StatTile
            eyebrow="Planned days"
            value={`${plannedDays}/${totalDays}`}
          />
          <StatTile
            eyebrow="Est. cost"
            value={totalCost > 0 ? formatCurrency(totalCost, currency) : "—"}
            tone="brand"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Day-by-day timeline */}
          <Section
            eyebrow="Itinerary"
            title="Day-by-day"
            description="A read-only view of the trip plan."
          >
            {trip.stops.length === 0 ? (
              <EmptyState
                icon="🗺️"
                title="No destinations yet"
                description="The owner hasn't added any stops to this trip."
              />
            ) : (
              <ol className="space-y-4">
                {days.map((slot) => {
                  const stopName =
                    slot.stop?.title ?? slot.stop?.city.name ?? null;
                  const country = slot.stop?.city.country?.name ?? null;
                  const dayCost = slot.activities.reduce(
                    (s, a) => s + (a.cost ?? 0),
                    0
                  );

                  return (
                    <li
                      key={slot.dayKey}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                            {slot.dayNumber}
                          </span>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                              Day {slot.dayNumber}
                            </p>
                            <p className="text-sm font-semibold text-zinc-900">
                              {fmtLong(slot.date)}
                              {stopName && (
                                <>
                                  <span className="mx-1.5 text-zinc-300">
                                    ·
                                  </span>
                                  <span className="text-zinc-600">
                                    📍 {stopName}
                                    {country ? `, ${country}` : ""}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        {dayCost > 0 && (
                          <Badge tone="neutral" size="sm">
                            {formatCurrency(dayCost, currency)}
                          </Badge>
                        )}
                      </div>

                      {slot.activities.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-zinc-400">
                          {slot.stop
                            ? "No activities scheduled for this day."
                            : "Free day · no stop assigned."}
                        </p>
                      ) : (
                        <ul className="divide-y divide-zinc-100">
                          {slot.activities.map((a) => {
                            const meta =
                              ACTIVITY_TYPE_META[a.type] ??
                              ACTIVITY_TYPE_META.OTHER;
                            return (
                              <li
                                key={a.id}
                                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto]"
                              >
                                <span
                                  className="hidden h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-base sm:flex"
                                  aria-hidden
                                >
                                  {meta.emoji}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span
                                      className="text-base sm:hidden"
                                      aria-hidden
                                    >
                                      {meta.emoji}
                                    </span>
                                    <p className="truncate text-sm font-semibold text-zinc-900">
                                      {a.name}
                                    </p>
                                    <Badge tone="neutral" size="xs">
                                      {meta.label}
                                    </Badge>
                                  </div>
                                  {a.notes && (
                                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                                      {a.notes}
                                    </p>
                                  )}
                                </div>
                                <span className="shrink-0 text-right text-sm font-semibold text-zinc-800">
                                  {a.cost != null && a.cost > 0
                                    ? `~ ${formatCurrency(a.cost, currency)}`
                                    : a.cost === 0
                                      ? "Free"
                                      : "—"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Section>

          {/* Side panel */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card padded>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Trip budget
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-zinc-500">Estimated total</span>
                <span className="text-2xl font-bold text-zinc-900">
                  {totalCost > 0 ? formatCurrency(totalCost, currency) : "—"}
                </span>
              </div>

              {breakdown.length > 0 && totalCost > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                  {breakdown.map((row) => {
                    const meta =
                      ACTIVITY_TYPE_META[row.type] ??
                      ACTIVITY_TYPE_META.OTHER;
                    const pct =
                      totalCost > 0
                        ? Math.round((row.total / totalCost) * 100)
                        : 0;
                    return (
                      <li key={row.type}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-zinc-600">
                            <span aria-hidden>{meta.emoji}</span>
                            <span className="font-medium">{meta.label}</span>
                            <span className="text-zinc-400">
                              · {row.count}
                            </span>
                          </span>
                          <span className="font-semibold text-zinc-700">
                            {formatCurrency(row.total, currency)}{" "}
                            <span className="font-normal text-zinc-400">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-800"
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 border-t border-zinc-100 pt-3 text-center text-[11px] text-zinc-400">
                  Add activities to see a budget breakdown.
                </p>
              )}
            </Card>

            <Card padded>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Stops
              </p>
              <ul className="mt-2 space-y-2">
                {trip.stops.map((stop, i) => {
                  const stopCost = stop.activities.reduce(
                    (sum, a) =>
                      sum +
                      (a.estimatedCost != null
                        ? Number(a.estimatedCost)
                        : 0),
                    0
                  );
                  return (
                    <li
                      key={stop.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium text-zinc-800">
                          {stop.title ?? stop.city.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-zinc-600">
                        {stopCost > 0 ? formatCurrency(stopCost, currency) : "—"}
                      </span>
                    </li>
                  );
                })}
                {trip.stops.length === 0 && (
                  <li className="text-center text-[11px] text-zinc-400">
                    No stops yet.
                  </li>
                )}
              </ul>
            </Card>

            {/* Copy CTA — visually present, not yet wired. Keeps the page from being a dead end. */}
            <Card padded className="bg-linear-to-br from-white to-teal-50/50">
              <p className="text-sm font-semibold text-zinc-900">
                Inspired by this plan?
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Save it to your account and tweak it for your own trip.
              </p>
              <div className="mt-3">
                <Button
                  variant="brand"
                  size="md"
                  fullWidth
                  disabled
                  title="Coming soon"
                >
                  Copy this trip
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}

function ExpiredView() {
  return (
    <main className="min-h-screen bg-app">
      <AppHeader width="default" />
      <PageContainer width="narrow" className="flex min-h-[60vh] items-center">
        <EmptyState
          icon="⌛"
          title="This share link has expired"
          description="The owner of this trip set an expiration date that has now passed. Ask them to generate a new link."
          variant="solid"
          className="w-full"
        />
      </PageContainer>
    </main>
  );
}
