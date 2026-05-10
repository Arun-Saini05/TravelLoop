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
      stops: {
        orderBy: { sortOrder: "asc" },
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
            },
          },
          activities: {
            orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              scheduledDate: true,
              notes: true,
              estimatedCost: true,
              activity: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  description: true,
                  googlePlaceId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trip) notFound();

  const mapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    "";

  // Serialize Prisma Decimal / Date objects → plain JS before crossing the
  // Server → Client Component boundary (Next.js requires plain objects).
  const serializedTrip = {
    ...trip,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    stops: trip.stops.map((stop) => ({
      ...stop,
      startDate: stop.startDate.toISOString(),
      endDate: stop.endDate.toISOString(),
      city: {
        ...stop.city,
        latitude: stop.city.latitude != null ? Number(stop.city.latitude) : null,
        longitude: stop.city.longitude != null ? Number(stop.city.longitude) : null,
      },
      activities: stop.activities.map((sa) => ({
        ...sa,
        scheduledDate: sa.scheduledDate ? sa.scheduledDate.toISOString() : null,
        estimatedCost: sa.estimatedCost != null ? Number(sa.estimatedCost) : null,
      })),
    })),
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <ItineraryBuilder trip={serializedTrip} mapsApiKey={mapsApiKey} />
    </main>
  );
}
