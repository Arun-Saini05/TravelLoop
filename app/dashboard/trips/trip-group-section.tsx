import { TripCard } from "@/app/dashboard/trips/trip-card";
import type { TripViewModel } from "@/app/dashboard/trips/types";

type TripGroupSectionProps = {
  title: string;
  description: string;
  trips: TripViewModel[];
  sectionId: string;
};

export function TripGroupSection({
  title,
  description,
  trips,
  sectionId,
}: TripGroupSectionProps) {
  return (
    <section aria-labelledby={sectionId} className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={sectionId} className="text-xl font-semibold text-zinc-900">
            {title}
          </h2>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
        <p className="text-sm font-medium text-zinc-700">
          {trips.length} {trips.length === 1 ? "trip" : "trips"}
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-600">
          No trips in this section right now.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="list">
          {trips.map((trip) => (
            <li key={trip.id}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
