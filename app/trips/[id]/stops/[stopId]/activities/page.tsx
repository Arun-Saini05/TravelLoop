import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ActivitiesSearch } from "./activities-search";
import { AppHeader, buttonClasses } from "@/components/ui";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string; stopId: string }>;
}

export default async function StopActivitiesPage({ params }: PageProps) {
  const session = await requireSession();
  const { id: tripId, stopId } = await params;

  const stop = await db.tripStop.findFirst({
    where: {
      id: stopId,
      tripId,
      trip: { members: { some: { userId: session.userId } } },
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      city: {
        select: {
          id: true,
          name: true,
          countryCode: true,
          latitude: true,
          longitude: true,
          country: { select: { name: true, costMultiplier: true } },
        },
      },
      activities: {
        orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          scheduledDate: true,
          estimatedCost: true,
          activity: {
            select: {
              id: true,
              name: true,
              type: true,
              googlePriceLevel: true,
              googlePlaceId: true,
            },
          },
        },
      },
    },
  });

  if (!stop) notFound();

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { name: true, currency: true },
  });

  const planned = stop.activities.map((a) => ({
    id: a.id,
    name: a.activity.name,
    type: a.activity.type,
    scheduledDate: a.scheduledDate ? a.scheduledDate.toISOString() : null,
    estimatedCost: a.estimatedCost != null ? Number(a.estimatedCost) : null,
    googlePlaceId: a.activity.googlePlaceId,
  }));

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const cityLat =
    stop.city.latitude != null ? Number(stop.city.latitude) : null;
  const cityLng =
    stop.city.longitude != null ? Number(stop.city.longitude) : null;

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="wide"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: trip?.name ?? "Trip", href: `/trips/${tripId}` },
          { label: "Builder", href: `/trips/${tripId}/itinerary` },
          { label: stop.title ?? stop.city.name },
        ]}
        actions={
          <Link
            href={`/trips/${tripId}/itinerary`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            ← Sections
          </Link>
        }
      />

      <ActivitiesSearch
        tripId={tripId}
        stopId={stop.id}
        cityName={stop.city.name}
        countryName={stop.city.country?.name ?? null}
        countryMultiplier={stop.city.country?.costMultiplier ?? null}
        stopStartDate={stop.startDate.toISOString()}
        stopEndDate={stop.endDate.toISOString()}
        currency={trip?.currency ?? "USD"}
        plannedActivities={planned}
        cityLat={cityLat}
        cityLng={cityLng}
        mapsApiKey={mapsApiKey}
      />
    </main>
  );
}
