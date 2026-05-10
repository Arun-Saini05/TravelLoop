import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ItineraryBuilder } from "./itinerary-builder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItineraryPage({ params }: PageProps) {
  const session = await requireSession();
  const { id: tripId } = await params;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      members: { some: { userId: session.userId } },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      currency: true,
      stops: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          arrivalNotes: true,
          startDate: true,
          endDate: true,
          sortOrder: true,
          city: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              country: { select: { name: true } },
            },
          },
          activities: {
            orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              scheduledDate: true,
              estimatedCost: true,
              activity: { select: { name: true, type: true } },
            },
          },
          _count: { select: { activities: true } },
        },
      },
    },
  });

  if (!trip) notFound();

  const serializedTrip = {
    id: trip.id,
    name: trip.name,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    currency: trip.currency,
    stops: trip.stops.map((stop) => {
      const estimatedBudget = stop.activities.reduce(
        (sum, a) => sum + (a.estimatedCost != null ? Number(a.estimatedCost) : 0),
        0
      );

      return {
        id: stop.id,
        title: stop.title,
        arrivalNotes: stop.arrivalNotes,
        startDate: stop.startDate.toISOString(),
        endDate: stop.endDate.toISOString(),
        sortOrder: stop.sortOrder,
        city: {
          id: stop.city.id,
          name: stop.city.name,
          countryCode: stop.city.countryCode,
          countryName: stop.city.country?.name ?? null,
        },
        activityCount: stop._count.activities,
        estimatedBudget,
        plannedActivities: stop.activities.map((a) => ({
          id: a.id,
          name: a.activity.name,
          type: a.activity.type,
          scheduledDate: a.scheduledDate ? a.scheduledDate.toISOString() : null,
          estimatedCost: a.estimatedCost != null ? Number(a.estimatedCost) : null,
        })),
      };
    }),
  };

  return (
    <main className="min-h-screen bg-app">
      <ItineraryBuilder trip={serializedTrip} />
    </main>
  );
}
