"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addActivity, type AddActivityActionState } from "@/app/actions/activities";
import { TripMap } from "./trip-map";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType =
  | "SIGHTSEEING" | "FOOD" | "ADVENTURE" | "CULTURE"
  | "NATURE" | "NIGHTLIFE" | "SHOPPING" | "WELLNESS"
  | "TRANSPORT" | "OTHER";

type StopActivity = {
  id: string;
  scheduledDate: Date | string | null;
  notes: string | null;
  estimatedCost: unknown;
  activity: {
    id: string;
    name: string;
    type: ActivityType;
    description: string | null;
    googlePlaceId: string;
  };
};

type Stop = {
  id: string;
  title: string | null;
  startDate: Date | string;
  endDate: Date | string;
  city: {
    id: string;
    name: string;
    countryCode: string;
    latitude: unknown;
    longitude: unknown;
  };
  activities: StopActivity[];
};

type Trip = {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  stops: Stop[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function fmt(d: Date | string) {
  return toDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtShort(d: Date | string) {
  return toDate(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayRange(start: Date | string, end: Date | string): Date[] {
  const s = toDate(start);
  const e = toDate(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  const cur = new Date(s);
  while (cur <= e) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

const TYPE_EMOJI: Record<ActivityType, string> = {
  SIGHTSEEING: "🏛️", FOOD: "🍽️", ADVENTURE: "🧗", CULTURE: "🎭",
  NATURE: "🌿", NIGHTLIFE: "🌃", SHOPPING: "🛍️", WELLNESS: "🧘",
  TRANSPORT: "🚂", OTHER: "📌",
};

// ─── Add Activity (inline manual form) ───────────────────────────────────────

function InlineAddForm({ stopId, date, onSuccess }: {
  stopId: string; date: string; onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("stopId", stopId);
    fd.set("name", name.trim());
    fd.set("scheduledDate", date);
    if (cost) fd.set("estimatedCost", cost);
    if (notes) fd.set("notes", notes);
    startTransition(async () => {
      const res = await addActivity({}, fd);
      if (res.error) { setErr(res.error); return; }
      setName(""); setCost(""); setNotes(""); setErr(null);
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-dashed border-zinc-300 p-3">
      <p className="text-xs font-semibold text-zinc-500">✏️ Custom activity</p>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <input
        value={name} onChange={e => setName(e.target.value)} required
        placeholder="Activity name"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />
      <div className="flex gap-2">
        <input
          value={cost} onChange={e => setCost(e.target.value)} type="number" min="0" step="0.01"
          placeholder="Cost (USD)"
          className="w-1/2 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <input
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notes"
          className="w-1/2 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </div>
      <button
        type="submit" disabled={isPending || !name.trim()}
        className="w-full rounded-lg bg-black py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "+ Add Activity"}
      </button>
    </form>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ date, stop, isOpen, onToggle, onActivityAdded }: {
  date: Date;
  stop: Stop;
  isOpen: boolean;
  onToggle: () => void;
  onActivityAdded: () => void;
}) {
  const ds = isoDate(date);
  const acts = stop.activities.filter(a => a.scheduledDate && isoDate(toDate(a.scheduledDate)) === ds);

  return (
    <div className={`rounded-xl border bg-white transition-shadow ${isOpen ? "border-black shadow-md" : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${isOpen ? "bg-black text-white" : "bg-zinc-100 text-zinc-700"}`}>
            {date.getDate()}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-900">{fmtShort(date)}</p>
            <p className="text-xs text-zinc-500">
              {acts.length === 0 ? "No activities yet" : `${acts.length} activit${acts.length === 1 ? "y" : "ies"}`}
            </p>
          </div>
        </div>
        <span className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3">
          {acts.length > 0 && (
            <ul className="space-y-2">
              {acts.map(sa => (
                <li key={sa.id} className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="mt-0.5 text-base">{TYPE_EMOJI[sa.activity.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900">{sa.activity.name}</p>
                    {sa.notes && <p className="text-xs text-zinc-500">{sa.notes}</p>}
                    {sa.estimatedCost != null && (
                      <p className="text-xs text-zinc-400">~${Number(sa.estimatedCost).toFixed(2)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <InlineAddForm stopId={stop.id} date={ds} onSuccess={onActivityAdded} />
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ItineraryBuilder({ trip, mapsApiKey }: { trip: Trip; mapsApiKey: string }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const stop = trip.stops[0];

  if (!stop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🗺️</p>
        <p className="text-lg font-semibold text-zinc-900">No destination set</p>
        <Link href="/trips/new" className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800">
          Create Trip
        </Link>
      </div>
    );
  }

  const days = dayRange(trip.startDate, trip.endDate);
  const cityLat = stop.city.latitude != null ? Number(stop.city.latitude) : null;
  const cityLng = stop.city.longitude != null ? Number(stop.city.longitude) : null;

  // Build planned pins — only activities that have known lat/lng stored in googlePlaceId
  // We approximate by using city center for now; real coords come from the Places API when added
  const plannedPins = stop.activities
    .filter(a => cityLat && cityLng)
    .map((a, i) => ({
      id: a.id,
      name: a.activity.name,
      lat: (cityLat ?? 0) + (i - stop.activities.length / 2) * 0.004,
      lng: (cityLng ?? 0) + (i - stop.activities.length / 2) * 0.004,
      type: a.activity.type,
      date: a.scheduledDate ? isoDate(toDate(a.scheduledDate)) : null,
    }));

  function refresh() { setVersion(v => v + 1); }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-bold tracking-tight text-black">Traveloop</Link>
            <span className="text-zinc-300">›</span>
            <span className="max-w-[200px] truncate text-sm text-zinc-600">{trip.name}</span>
          </div>
          <Link href="/dashboard" className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Trip overview */}
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{trip.name}</h1>
              <p className="mt-0.5 text-sm text-zinc-500">
                {fmt(trip.startDate)} → {fmt(trip.endDate)}
                <span className="mx-2 text-zinc-300">·</span>
                {days.length} day{days.length !== 1 ? "s" : ""}
                <span className="mx-2 text-zinc-300">·</span>
                📍 {stop.city.name}
              </p>
            </div>
            <span className="mt-2 w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:mt-0">
              {stop.activities.length} activit{stop.activities.length !== 1 ? "ies" : "y"} planned
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 lg:items-start">
          {/* LEFT: Day cards */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Build Your Itinerary</h2>
              <p className="text-xs text-zinc-500">Click a day to add activities</p>
            </div>
            <div key={version} className="space-y-3">
              {days.map(date => {
                const ds = isoDate(date);
                return (
                  <DayCard
                    key={ds}
                    date={date}
                    stop={stop}
                    isOpen={openDay === ds}
                    onToggle={() => setOpenDay(prev => prev === ds ? null : ds)}
                    onActivityAdded={refresh}
                  />
                );
              })}
            </div>
          </div>

          {/* RIGHT: Map — sticky on desktop */}
          <div className="hidden lg:block lg:w-[420px] xl:w-[480px]" style={{ position: "sticky", top: "72px", alignSelf: "flex-start" }}>
            <TripMap
              cityName={stop.city.name}
              cityLat={cityLat}
              cityLng={cityLng}
              plannedPins={plannedPins}
              stopId={stop.id}
              mapsApiKey={mapsApiKey}
              selectedDate={openDay}
              onActivityAdded={refresh}
            />
          </div>
        </div>

        {/* Mobile map (collapsed below days) */}
        <div className="mt-6 lg:hidden">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">🗺️ Map</h2>
          <TripMap
            cityName={stop.city.name}
            cityLat={cityLat}
            cityLng={cityLng}
            plannedPins={plannedPins}
            stopId={stop.id}
            mapsApiKey={mapsApiKey}
            selectedDate={openDay}
            onActivityAdded={refresh}
          />
        </div>
      </div>
    </div>
  );
}
