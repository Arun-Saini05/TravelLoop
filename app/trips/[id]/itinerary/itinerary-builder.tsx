"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addStop,
  deleteStop,
  updateStopDates,
  updateStopNotes,
  updateStopTitle,
  type StopActionState,
} from "@/app/actions/stops";
import {
  CitySearchInput,
  type SelectedPlace,
} from "@/components/places/city-search-input";
import {
  AppHeader,
  Badge,
  Button,
  buttonClasses,
  Card,
  EmptyState,
  Field,
  FloatingActionBar,
  IconButton,
  Input,
  PageContainer,
  Textarea,
} from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlannedActivityPreview = {
  id: string;
  name: string;
  type: string;
  scheduledDate: string | null;
  estimatedCost: number | null;
};

type Stop = {
  id: string;
  title: string | null;
  arrivalNotes: string | null;
  startDate: string;
  endDate: string;
  sortOrder: number;
  city: {
    id: string;
    name: string;
    countryCode: string;
    countryName: string | null;
  };
  activityCount: number;
  estimatedBudget: number;
  plannedActivities: PlannedActivityPreview[];
};

const ACTIVITY_TYPE_EMOJI: Record<string, string> = {
  SIGHTSEEING: "🏛️",
  FOOD:        "🍽️",
  ADVENTURE:   "🧗",
  CULTURE:     "🎭",
  NATURE:      "🌿",
  NIGHTLIFE:   "🌃",
  SHOPPING:    "🛍️",
  WELLNESS:    "🧘",
  TRANSPORT:   "🚂",
  OTHER:       "📌",
};

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  stops: Stop[];
};

type SiblingRange = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isoDate(value: string): string {
  return value.slice(0, 10);
}

function dayCount(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
}

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

function fmtRangeShort(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${new Date(start).toLocaleDateString("en-US", opts)} – ${new Date(end).toLocaleDateString("en-US", opts)}`;
}

/** Strict-overlap check matching the server-side rule (touching endpoints OK). */
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

// ─── Date popover ────────────────────────────────────────────────────────────

function DateRangePopover({
  stopId,
  startDate,
  endDate,
  tripStart,
  tripEnd,
  siblings,
  onClose,
  onSaved,
}: {
  stopId: string;
  startDate: string;
  endDate: string;
  tripStart: string;
  tripEnd: string;
  siblings: SiblingRange[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [start, setStart] = useState(isoDate(startDate));
  const [end, setEnd] = useState(isoDate(endDate));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tripStartIso = isoDate(tripStart);
  const tripEndIso = isoDate(tripEnd);

  function clientValidate(s: string, e: string): string | null {
    if (!s || !e) return "Provide valid start and end dates.";
    const sd = new Date(s);
    const ed = new Date(e);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) return "Invalid date.";
    if (ed < sd) return "End date cannot be before start date.";
    if (sd < new Date(tripStartIso) || ed > new Date(tripEndIso)) {
      return `Dates must be within the trip's range (${fmtRangeShort(tripStart, tripEnd)}).`;
    }
    const conflict = siblings.find((sib) => rangesOverlap(s, e, sib.startDate, sib.endDate));
    if (conflict) {
      return `These dates overlap with "${conflict.label}" (${fmtRangeShort(conflict.startDate, conflict.endDate)}).`;
    }
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const localError = clientValidate(start, end);
    if (localError) {
      setError(localError);
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("stopId", stopId);
    fd.set("startDate", start);
    fd.set("endDate", end);

    startTransition(async () => {
      const res = await updateStopDates({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      onSaved();
      onClose();
    });
  }

  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-[11px] text-zinc-500">
          Trip range: {fmtRangeShort(tripStart, tripEnd)}
        </p>
        <Field label="Start date">
          <Input
            type="date"
            size="sm"
            value={start}
            min={tripStartIso}
            max={tripEndIso}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </Field>
        <Field label="End date">
          <Input
            type="date"
            size="sm"
            value={end}
            min={start || tripStartIso}
            max={tripEndIso}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </Field>
        {siblings.length > 0 && (
          <div className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[11px] text-zinc-500">
            <p className="font-medium text-zinc-600">Other sections (avoid overlap):</p>
            <ul className="mt-0.5 space-y-0.5">
              {siblings.map((sib) => (
                <li key={sib.id}>
                  {sib.label} · {fmtRangeShort(sib.startDate, sib.endDate)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Section card ────────────────────────────────────────────────────────────

function SectionCard({
  index,
  tripId,
  stop,
  canDelete,
  tripStart,
  tripEnd,
  siblings,
  currency,
}: {
  index: number;
  tripId: string;
  stop: Stop;
  canDelete: boolean;
  tripStart: string;
  tripEnd: string;
  siblings: SiblingRange[];
  currency: string;
}) {
  const [showDates, setShowDates] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(stop.title ?? stop.city.name);
  const [notesDraft, setNotesDraft] = useState(stop.arrivalNotes ?? "");
  const [notesSaved, setNotesSaved] = useState<boolean | null>(null);
  const [titlePending, startTitleTransition] = useTransition();
  const [notesPending, startNotesTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showDates) return;
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowDates(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showDates]);

  function saveTitle() {
    const next = titleDraft.trim();
    if (!next || next === (stop.title ?? stop.city.name)) {
      setEditingTitle(false);
      setTitleDraft(stop.title ?? stop.city.name);
      return;
    }
    const fd = new FormData();
    fd.set("stopId", stop.id);
    fd.set("title", next);
    startTitleTransition(async () => {
      const res = await updateStopTitle({}, fd);
      if (res.error) setError(res.error);
      setEditingTitle(false);
    });
  }

  function saveNotes() {
    const next = notesDraft.trim();
    if (next === (stop.arrivalNotes ?? "").trim()) {
      setNotesSaved(null);
      return;
    }
    const fd = new FormData();
    fd.set("stopId", stop.id);
    fd.set("arrivalNotes", next);
    startNotesTransition(async () => {
      const res = await updateStopNotes({}, fd);
      if (res.error) {
        setError(res.error);
        setNotesSaved(false);
      } else {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(null), 1500);
      }
    });
  }

  function handleDelete() {
    if (!canDelete) return;
    const ok = window.confirm(
      `Remove "${stop.title ?? stop.city.name}" from your trip? This also removes any planned activities for this stop.`
    );
    if (!ok) return;

    const fd = new FormData();
    fd.set("stopId", stop.id);
    startDeleteTransition(async () => {
      const res: StopActionState = await deleteStop({}, fd);
      if (res.error) setError(res.error);
    });
  }

  const days = dayCount(stop.startDate, stop.endDate);
  const dateLabel = `${fmt(stop.startDate)} → ${fmt(stop.endDate)}`;

  return (
    <Card padded interactive className="relative">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <Input
                size="sm"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveTitle();
                  } else if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleDraft(stop.title ?? stop.city.name);
                  }
                }}
                disabled={titlePending}
                autoFocus
                className="text-base font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(stop.title ?? stop.city.name);
                  setEditingTitle(true);
                }}
                className="block truncate text-left text-base font-semibold tracking-tight text-zinc-900 hover:text-teal-700"
              >
                Section {index + 1}: {stop.title ?? stop.city.name}
              </button>
            )}
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              📍 {stop.city.name}
              {stop.city.countryName ? `, ${stop.city.countryName}` : ""}
            </p>
          </div>
        </div>

        {canDelete && (
          <IconButton
            aria-label="Remove section"
            tone="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deletePending}
            title="Remove section"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </IconButton>
        )}
      </header>

      <div className="mb-4">
        <Textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          placeholder="All the necessary information about this section. This can be anything like travel notes, hotel info, or any other activity."
          disabled={notesPending}
        />
        <div className="mt-1 flex h-4 items-center justify-end text-[11px]">
          {notesPending && <span className="text-zinc-400">Saving…</span>}
          {notesSaved === true && (
            <span className="text-emerald-600">Saved ✓</span>
          )}
        </div>
      </div>

      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-800 transition hover:border-teal-500 hover:bg-teal-50/30"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Date range</span>
              <span className="text-sm">{dateLabel}</span>
            </span>
          </span>
          <Badge tone="neutral" size="sm">
            {days} day{days === 1 ? "" : "s"}
          </Badge>
        </button>
        {showDates && (
          <DateRangePopover
            stopId={stop.id}
            startDate={stop.startDate}
            endDate={stop.endDate}
            tripStart={tripStart}
            tripEnd={tripEnd}
            siblings={siblings}
            onClose={() => setShowDates(false)}
            onSaved={() => {
              /* handled by revalidatePath */
            }}
          />
        )}
      </div>

      {stop.plannedActivities.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Planned activities
            </p>
            <Badge tone="neutral" size="xs">
              {stop.plannedActivities.length}
            </Badge>
          </div>
          <ul className="space-y-1.5">
            {stop.plannedActivities.slice(0, 4).map((a) => {
              const emoji = ACTIVITY_TYPE_EMOJI[a.type] ?? ACTIVITY_TYPE_EMOJI.OTHER;
              const day = a.scheduledDate
                ? new Date(a.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : null;
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-1.5 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden>{emoji}</span>
                    <span className="truncate font-medium text-zinc-800">{a.name}</span>
                    {day && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                        {day}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-zinc-700">
                    {a.estimatedCost && a.estimatedCost > 0
                      ? `~ ${formatCurrency(a.estimatedCost, currency)}`
                      : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          {stop.plannedActivities.length > 4 && (
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              + {stop.plannedActivities.length - 4} more
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-xs text-zinc-500">
            {stop.activityCount === 0
              ? "No activities planned yet."
              : `${stop.activityCount} activit${stop.activityCount === 1 ? "y" : "ies"} planned.`}
          </p>
          <p className="text-xs font-medium text-zinc-700">
            Est. budget:{" "}
            <span className={stop.estimatedBudget > 0 ? "text-emerald-700" : "text-zinc-400"}>
              {stop.estimatedBudget > 0
                ? `~ ${formatCurrency(stop.estimatedBudget, currency)}`
                : "—"}
            </span>
          </p>
        </div>
        <Link
          href={`/trips/${tripId}/stops/${stop.id}/activities`}
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          {stop.activityCount === 0 ? "+ Add activities" : "Manage activities"}
        </Link>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </Card>
  );
}

// ─── Add Section modal ───────────────────────────────────────────────────────

function AddSectionModal({
  tripId,
  onClose,
}: {
  tripId: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!selected) return;
    setError(null);

    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("selectedPlaceId", selected.placeId);
    fd.set("selectedPlaceName", selected.name);
    fd.set("selectedPlaceAddress", selected.address ?? "");
    fd.set("selectedPlaceRegion", selected.region ?? "");
    fd.set("selectedPlaceCountryCode", selected.countryCode ?? "");
    fd.set("selectedPlaceCountryName", selected.countryName ?? "");
    fd.set("selectedPlaceLatitude", selected.latitude?.toString() ?? "");
    fd.set("selectedPlaceLongitude", selected.longitude?.toString() ?? "");

    startTransition(async () => {
      const res = await addStop({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Step 2 · Add stop
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900">
              Add another section
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Pick the next city or destination for your trip.
            </p>
          </div>
          <IconButton
            aria-label="Close"
            tone="neutral"
            onClick={onClose}
          >
            ✕
          </IconButton>
        </div>

        <CitySearchInput
          selectedPlace={selected}
          onChange={setSelected}
          autoFocus
        />

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={!selected}
            loading={pending}
          >
            {pending ? "Adding…" : "Add section"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function ItineraryBuilder({ trip }: { trip: Trip }) {
  const [showAdd, setShowAdd] = useState(false);

  const totalDays = dayCount(trip.startDate, trip.endDate);
  const isEmpty = trip.stops.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <AppHeader
        width="narrow"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My trips", href: "/dashboard/trips" },
          { label: trip.name, href: `/trips/${trip.id}` },
          { label: "Builder" },
        ]}
        actions={
          <Link
            href={`/trips/${trip.id}`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            View details
          </Link>
        }
      />

      <PageContainer width="narrow" withFloatingBar={!isEmpty}>
        <Card padded className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                Step 2 · Build itinerary
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
                {trip.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {fmt(trip.startDate)} → {fmt(trip.endDate)}
                <span className="mx-2 text-zinc-300">·</span>
                {totalDays} day{totalDays === 1 ? "" : "s"}
                <span className="mx-2 text-zinc-300">·</span>
                {trip.stops.length} section{trip.stops.length === 1 ? "" : "s"}
              </p>
            </div>
            {!isEmpty && (
              <Link
                href={`/trips/${trip.id}`}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                View day-by-day →
              </Link>
            )}
          </div>
        </Card>

        {isEmpty && (
          <EmptyState
            icon="🗺️"
            title="No destinations yet"
            description="Add your first city to start building this trip."
            className="mb-4"
          />
        )}

        {!isEmpty && (
          <div className="space-y-4">
            {trip.stops.map((stop, index) => {
              const siblings: SiblingRange[] = trip.stops
                .filter((s) => s.id !== stop.id)
                .map((s) => ({
                  id: s.id,
                  label: s.title ?? s.city.name,
                  startDate: s.startDate,
                  endDate: s.endDate,
                }));

              return (
                <SectionCard
                  key={stop.id}
                  index={index}
                  tripId={trip.id}
                  stop={stop}
                  canDelete={trip.stops.length > 1}
                  tripStart={trip.startDate}
                  tripEnd={trip.endDate}
                  siblings={siblings}
                  currency={trip.currency}
                />
              );
            })}
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-white px-4 py-5 text-sm font-semibold text-zinc-700 transition hover:border-teal-500 hover:bg-teal-50/40 hover:text-teal-700"
          >
            <span className="text-lg">＋</span>
            {isEmpty ? "Add your first destination" : "Add another section"}
          </button>
        </div>
      </PageContainer>

      {!isEmpty && (
        <FloatingActionBar
          helper={`${trip.stops.length} section${trip.stops.length === 1 ? "" : "s"} planned`}
        >
          <Link
            href={`/trips/${trip.id}/itinerary`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            ↺ Refresh
          </Link>
          <Link
            href={`/trips/${trip.id}`}
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            View itinerary →
          </Link>
        </FloatingActionBar>
      )}

      {showAdd && <AddSectionModal tripId={trip.id} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
