"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addActivityFromPlace,
  removeStopActivity,
  updateStopActivityDate,
  type PlannedActivityDTO,
} from "@/app/actions/activities";
import {
  categoryToActivityType,
  estimatedUsd,
  priceLevelToSymbol,
} from "@/lib/pricing";
import { StopMap, type MapResult, type StopMapHandle } from "./stop-map";
import {
  Badge,
  Button,
  buttonClasses,
  Card,
  EmptyState,
  FloatingActionBar,
  IconButton,
  Input,
  PageContainer,
  Select,
} from "@/components/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityResult = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  userRatingCount: number | null;
  photoRef: string | null;
  lat: number | null;
  lng: number | null;
  priceLevel: number | null;
};

type Props = {
  tripId: string;
  stopId: string;
  cityName: string;
  countryName: string | null;
  countryMultiplier: number | null;
  stopStartDate: string;
  stopEndDate: string;
  currency: string;
  plannedActivities: PlannedActivityDTO[];
  cityLat: number | null;
  cityLng: number | null;
  mapsApiKey: string;
};

type SortMode = "popular" | "rating" | "price-asc" | "price-desc";

type DayOption = {
  /** YYYY-MM-DD (UTC day) — used as scheduledDate value sent to the server. */
  key: string;
  dayNumber: number;
  /** "Day 3" */
  shortLabel: string;
  /** "Day 3 · Wed May 14" */
  fullLabel: string;
  /** "Wed, May 14" */
  prettyDate: string;
};

const FILTER_CHIPS: ReadonlyArray<{ id: string; label: string; query: string | null }> = [
  { id: "all",         label: "All",         query: null },
  { id: "sightseeing", label: "Sightseeing", query: "tourist attractions and sightseeing" },
  { id: "food",        label: "Food",        query: "best restaurants and food experiences" },
  { id: "adventure",   label: "Adventure",   query: "adventure and outdoor activities" },
  { id: "culture",     label: "Culture",     query: "museums and cultural experiences" },
  { id: "nature",      label: "Nature",      query: "parks gardens and nature spots" },
  { id: "nightlife",   label: "Nightlife",   query: "nightlife bars and clubs" },
  { id: "shopping",    label: "Shopping",    query: "shopping districts and markets" },
  { id: "wellness",    label: "Wellness",    query: "spa wellness and yoga" },
];

const TYPE_META: Record<
  string,
  { emoji: string; label: string }
> = {
  SIGHTSEEING: { emoji: "🏛️", label: "Sightseeing" },
  FOOD:        { emoji: "🍽️", label: "Food" },
  ADVENTURE:   { emoji: "🧗", label: "Adventure" },
  CULTURE:     { emoji: "🎭", label: "Culture" },
  NATURE:      { emoji: "🌿", label: "Nature" },
  NIGHTLIFE:   { emoji: "🌃", label: "Nightlife" },
  SHOPPING:    { emoji: "🛍️", label: "Shopping" },
  WELLNESS:    { emoji: "🧘", label: "Wellness" },
  TRANSPORT:   { emoji: "🚂", label: "Transport" },
  OTHER:       { emoji: "📌", label: "Other" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function isoDayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  )
    .toISOString()
    .slice(0, 10);
}

function buildDays(startIso: string, endIso: string): DayOption[] {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMs = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endMs = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  const totalDays = Math.max(1, Math.floor((endMs - startMs) / 86_400_000) + 1);

  const days: DayOption[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startMs + i * 86_400_000);
    const pretty = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    days.push({
      key: d.toISOString().slice(0, 10),
      dayNumber: i + 1,
      shortLabel: `Day ${i + 1}`,
      fullLabel: `Day ${i + 1} · ${pretty}`,
      prettyDate: pretty,
    });
  }
  return days;
}

// ─── Day pill row ────────────────────────────────────────────────────────────

function DayPills({
  days,
  selectedKey,
  onSelect,
}: {
  days: DayOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <Card padded={false} className="mb-4 p-3">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">
            Adding to
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {days.find((d) => d.key === selectedKey)?.fullLabel ?? days[0].fullLabel}
          </p>
        </div>
        <p className="text-[11px] text-zinc-400">
          {days.length} day{days.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map((d) => {
          const active = d.key === selectedKey;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelect(d.key)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-500 hover:text-teal-700"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  active ? "text-white/70" : "text-zinc-400"
                }`}
              >
                {d.shortLabel}
              </p>
              <p className="text-xs font-semibold">{d.prettyDate}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Selected activities preview + inline reschedule + budget ───────────────

function SelectedActivities({
  planned,
  currency,
  days,
  pendingRemoveId,
  pendingRescheduleId,
  onRemove,
  onReschedule,
  onLocate,
  locatablePlaceIds,
}: {
  planned: PlannedActivityDTO[];
  currency: string;
  days: DayOption[];
  pendingRemoveId: string | null;
  pendingRescheduleId: string | null;
  onRemove: (assignmentId: string) => void;
  onReschedule: (assignmentId: string, newKey: string) => void;
  onLocate: (placeId: string) => void;
  locatablePlaceIds: Set<string>;
}) {
  const total = planned.reduce((sum, a) => sum + (a.estimatedCost ?? 0), 0);

  const byType = useMemo(() => {
    const acc = new Map<string, { count: number; total: number }>();
    for (const a of planned) {
      const cur = acc.get(a.type) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += a.estimatedCost ?? 0;
      acc.set(a.type, cur);
    }
    return Array.from(acc.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [planned]);

  // Group planned activities by day for the per-day mini sections.
  const byDay = useMemo(() => {
    const map = new Map<string, PlannedActivityDTO[]>();
    for (const a of planned) {
      const key = a.scheduledDate ? isoDayKey(a.scheduledDate) : days[0].key;
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [planned, days]);

  return (
    <Card padded className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          Selected activities
        </h2>
        <Badge tone="brand" size="sm">
          {planned.length} selected
        </Badge>
      </div>

      {planned.length === 0 ? (
        <EmptyState
          icon="✨"
          title="Nothing planned yet"
          description="Pick a day above, then add activities from the search or map."
        />
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const dayItems = byDay.get(day.key) ?? [];
            if (dayItems.length === 0) return null;
            const dayTotal = dayItems.reduce(
              (s, a) => s + (a.estimatedCost ?? 0),
              0
            );
            return (
              <div key={day.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                      {day.shortLabel}
                    </span>
                    {day.prettyDate}
                  </p>
                  {dayTotal > 0 && (
                    <span className="text-[11px] font-semibold text-zinc-700">
                      {formatCurrency(dayTotal, currency)}
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {dayItems.map((a) => {
                    const meta = TYPE_META[a.type] ?? TYPE_META.OTHER;
                    const isRemoving = pendingRemoveId === a.id;
                    const isReschedule = pendingRescheduleId === a.id;
                    const isLocatable = locatablePlaceIds.has(a.googlePlaceId);
                    return (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="text-base" aria-hidden>{meta.emoji}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">{a.name}</p>
                            <p className="text-[11px] text-zinc-500">{meta.label}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {/* Day picker */}
                          <Select
                            aria-label="Reschedule day"
                            value={day.key}
                            disabled={isReschedule}
                            onChange={(e) => onReschedule(a.id, e.target.value)}
                            size="sm"
                            className="w-[140px] text-[11px]"
                          >
                            {days.map((d) => (
                              <option key={d.key} value={d.key}>
                                {d.shortLabel} · {d.prettyDate}
                              </option>
                            ))}
                          </Select>
                          {/* Cost */}
                          <span className="text-xs font-semibold text-zinc-700">
                            {a.estimatedCost && a.estimatedCost > 0
                              ? `~ ${formatCurrency(a.estimatedCost, currency)}`
                              : "—"}
                          </span>
                          {/* Locate on map (only when a marker exists) */}
                          {isLocatable && (
                            <IconButton
                              aria-label={`Locate ${a.name} on map`}
                              tone="brand"
                              size="sm"
                              onClick={() => onLocate(a.googlePlaceId)}
                              title="Locate on map"
                              className="hidden sm:inline-flex"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            </IconButton>
                          )}
                          {/* Remove */}
                          <IconButton
                            aria-label={`Remove ${a.name}`}
                            tone="danger"
                            size="sm"
                            onClick={() => onRemove(a.id)}
                            disabled={isRemoving}
                            title="Remove"
                          >
                            {isRemoving ? (
                              <span className="text-[11px]">…</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                          </IconButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline budget */}
      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Estimated budget
          </h3>
          <p className="text-base font-bold text-zinc-900">
            {total > 0 ? formatCurrency(total, currency) : "—"}
          </p>
        </div>
        {byType.length > 0 && total > 0 && (
          <ul className="mt-3 space-y-1.5">
            {byType.map((row) => {
              const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
              const meta = TYPE_META[row.type] ?? TYPE_META.OTHER;
              return (
                <li key={row.type}>
                  <div className="flex items-center justify-between text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden>{meta.emoji}</span>
                      <span className="font-medium">{meta.label}</span>
                      <span className="text-zinc-400">· {row.count}</span>
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {formatCurrency(row.total, currency)}{" "}
                      <span className="font-normal text-zinc-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-800"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ─── Result row ──────────────────────────────────────────────────────────────

function ResultRow({
  result,
  countryMultiplier,
  currency,
  alreadyAdded,
  selectedDayLabel,
  onAdd,
  onLocate,
  isAdding,
}: {
  result: ActivityResult;
  countryMultiplier: number | null;
  currency: string;
  alreadyAdded: boolean;
  selectedDayLabel: string;
  onAdd: () => void;
  onLocate: () => void;
  isAdding: boolean;
}) {
  const inferredType = categoryToActivityType(result.category);
  const { usd, isEstimated } = estimatedUsd(
    result.priceLevel,
    inferredType,
    countryMultiplier
  );
  const symbol = priceLevelToSymbol(result.priceLevel);
  const hasCoords = result.lat != null && result.lng != null;

  return (
    <li className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              {result.name}
            </h3>
            {hasCoords && (
              <IconButton
                aria-label={`Locate ${result.name} on map`}
                tone="brand"
                size="sm"
                onClick={onLocate}
                title="Locate on map"
                className="shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </IconButton>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            {result.category && <span>{result.category}</span>}
            {result.rating != null && (
              <span className="flex items-center gap-1">
                <span className="text-amber-500">★</span>
                <span>{result.rating.toFixed(1)}</span>
                {result.userRatingCount != null && (
                  <span className="text-zinc-400">({result.userRatingCount.toLocaleString()})</span>
                )}
              </span>
            )}
          </div>
          {result.address && (
            <p className="mt-1 truncate text-xs text-zinc-400">{result.address}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex flex-col items-start sm:items-end">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                isEstimated
                  ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                  : (result.priceLevel ?? 0) === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : (result.priceLevel ?? 0) <= 2
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
              title={
                isEstimated
                  ? "No Google price level — showing an estimate based on activity type and country."
                  : `Google price level ${result.priceLevel} of 4`
              }
            >
              {isEstimated ? "est." : symbol}
            </span>
            <span className="mt-0.5 text-xs font-medium text-zinc-700">
              {usd === 0 ? "Free" : `~ ${formatCurrency(usd, currency)}`}
              {isEstimated && (
                <span className="ml-1 text-[10px] font-normal text-zinc-400">est.</span>
              )}
            </span>
          </div>

          {alreadyAdded ? (
            <Badge tone="success" size="sm" className="cursor-default rounded-lg px-3 py-1.5">
              ✓ Added
            </Badge>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={onAdd}
              loading={isAdding}
              title={`Add to ${selectedDayLabel}`}
            >
              {isAdding ? "Adding…" : `+ Add to ${selectedDayLabel}`}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function ActivitiesSearch({
  tripId,
  stopId,
  cityName,
  countryName,
  countryMultiplier,
  stopStartDate,
  stopEndDate,
  currency,
  plannedActivities,
  cityLat,
  cityLng,
  mapsApiKey,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [showSort, setShowSort] = useState(false);

  const [results, setResults] = useState<ActivityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Day pills
  const days = useMemo(
    () => buildDays(stopStartDate, stopEndDate),
    [stopStartDate, stopEndDate]
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string>(days[0].key);
  const selectedDay =
    days.find((d) => d.key === selectedDayKey) ?? days[0];

  // Selected activities are managed locally so add + remove + reschedule stay
  // in sync without a full server round-trip. Source of truth still lives in
  // the DB via revalidatePath.
  const [planned, setPlanned] = useState<PlannedActivityDTO[]>(plannedActivities);
  const addedPlaceIds = useMemo(
    () => new Set(planned.map((p) => p.googlePlaceId)),
    [planned]
  );

  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startMutation] = useTransition();

  // Map ref + helper
  const mapRef = useRef<StopMapHandle | null>(null);
  function focusOnMap(placeId: string) {
    mapRef.current?.focus(placeId);
  }

  const effectiveQuery = useMemo(() => {
    const userPart = query.trim();
    if (userPart) return userPart;
    const filter = FILTER_CHIPS.find((f) => f.id === activeFilter);
    return filter?.query ?? "";
  }, [query, activeFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(null);
        const params = new URLSearchParams({ city: cityName });
        if (effectiveQuery) params.set("query", effectiveQuery);

        const res = await fetch(`/api/places/activities?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await res.json()) as { activities?: ActivityResult[]; error?: string };

        if (!res.ok || data.error) {
          throw new Error(data.error ?? "Failed to load activities.");
        }
        setResults(data.activities ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "Unable to load activities.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [cityName, effectiveQuery]);

  const sortedResults = useMemo(() => {
    const list = [...results];
    switch (sortMode) {
      case "rating":
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price-asc":
        list.sort((a, b) => (a.priceLevel ?? 99) - (b.priceLevel ?? 99));
        break;
      case "price-desc":
        list.sort((a, b) => (b.priceLevel ?? -1) - (a.priceLevel ?? -1));
        break;
      default:
        break;
    }
    return list;
  }, [results, sortMode]);

  // Map-friendly slice of the current results.
  const mapResults = useMemo<MapResult[]>(
    () =>
      sortedResults.map((r) => ({
        placeId: r.placeId,
        name: r.name,
        category: r.category,
        rating: r.rating,
        lat: r.lat,
        lng: r.lng,
      })),
    [sortedResults]
  );
  const visibleMapPlaceIds = useMemo(
    () => new Set(mapResults.filter((r) => r.lat != null && r.lng != null).map((r) => r.placeId)),
    [mapResults]
  );

  function addByPlaceId(placeId: string) {
    const result = sortedResults.find((r) => r.placeId === placeId);
    if (!result) return;
    handleAdd(result);
  }

  function handleAdd(result: ActivityResult) {
    if (addedPlaceIds.has(result.placeId)) return;
    setActionError(null);
    setAddingId(result.placeId);

    const fd = new FormData();
    fd.set("stopId", stopId);
    fd.set("googlePlaceId", result.placeId);
    fd.set("name", result.name);
    fd.set("category", result.category ?? "");
    fd.set("address", result.address ?? "");
    fd.set("photoRef", result.photoRef ?? "");
    fd.set("priceLevel", result.priceLevel?.toString() ?? "");
    fd.set("rating", result.rating?.toString() ?? "");
    fd.set("scheduledDate", selectedDayKey);

    startMutation(async () => {
      const res = await addActivityFromPlace({}, fd);
      setAddingId(null);
      if (res.error || !res.assignment) {
        setActionError(res.error ?? "Failed to add activity.");
        return;
      }
      setPlanned((prev) => [...prev, res.assignment!]);
    });
  }

  function handleRemove(assignmentId: string) {
    setActionError(null);
    setRemovingId(assignmentId);

    const fd = new FormData();
    fd.set("stopActivityId", assignmentId);

    startMutation(async () => {
      const res = await removeStopActivity({}, fd);
      setRemovingId(null);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      setPlanned((prev) => prev.filter((p) => p.id !== assignmentId));
    });
  }

  function handleReschedule(assignmentId: string, newKey: string) {
    setActionError(null);
    setRescheduleId(assignmentId);

    const fd = new FormData();
    fd.set("stopActivityId", assignmentId);
    fd.set("scheduledDate", newKey);

    startMutation(async () => {
      const res = await updateStopActivityDate({}, fd);
      setRescheduleId(null);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      const newIso = res.scheduledDate ?? new Date(newKey).toISOString();
      setPlanned((prev) =>
        prev.map((p) =>
          p.id === assignmentId ? { ...p, scheduledDate: newIso } : p
        )
      );
    });
  }

  const totalPlannedCost = planned.reduce(
    (sum, a) => sum + (a.estimatedCost ?? 0),
    0
  );

  // countryMultiplier is intentionally hidden from the UI per design — it still
  // drives the per-result ~$ figure under the hood via `priceLevelToUsd`.
  void countryMultiplier;

  return (
    <PageContainer width="wide" withFloatingBar>
      {/* Stop overview */}
      <Card padded className="mb-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Step 3 · Activities for
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              {cityName}
              {countryName ? `, ${countryName}` : ""}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {new Date(stopStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" → "}
              {new Date(stopEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <Badge tone="success" size="sm">
              {planned.length} planned
            </Badge>
            {totalPlannedCost > 0 && (
              <span className="mt-1 text-xs text-zinc-500">
                Est. {formatCurrency(totalPlannedCost, currency)} total
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Two-column layout: left = pills/selected/search/results; right = sticky map */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="min-w-0">
          {/* Mobile-only top map (hidden on lg+ — desktop uses the right column) */}
          <div className="mb-4 h-[260px] lg:hidden">
            <StopMap
              ref={mapRef}
              apiKey={mapsApiKey}
              cityName={cityName}
              cityLat={cityLat}
              cityLng={cityLng}
              results={mapResults}
              plannedPlaceIds={addedPlaceIds}
              selectedDayLabel={selectedDay.shortLabel}
              isAdding={addingId != null}
              onMarkerAdd={addByPlaceId}
            />
          </div>

          {/* Day pills */}
          <DayPills
            days={days}
            selectedKey={selectedDayKey}
            onSelect={setSelectedDayKey}
          />

          {/* Selected activities preview + inline budget */}
          <SelectedActivities
            planned={planned}
            currency={currency}
            days={days}
            pendingRemoveId={removingId}
            pendingRescheduleId={rescheduleId}
            onRemove={handleRemove}
            onReschedule={handleReschedule}
            onLocate={focusOnMap}
            locatablePlaceIds={visibleMapPlaceIds}
          />

          {/* Search bar + controls */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. paragliding, museums, ramen…"
              />
              {loading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  Searching…
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowSort((v) => !v)}
                >
                  Sort by ▾
                </Button>
                {showSort && (
                  <div
                    className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
                    onMouseLeave={() => setShowSort(false)}
                  >
                    {([
                      ["popular", "Most relevant"],
                      ["rating", "Top rated"],
                      ["price-asc", "Price: low → high"],
                      ["price-desc", "Price: high → low"],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSortMode(id);
                          setShowSort(false);
                        }}
                        className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition ${
                          sortMode === id
                            ? "bg-ink text-white"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="mb-5 flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-teal-500 hover:text-teal-700"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {actionError && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          )}

          {/* Results */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Results</h2>

            {searchError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchError}
              </p>
            )}

            {!searchError && loading && results.length === 0 && (
              <ul className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                  />
                ))}
              </ul>
            )}

            {!searchError && !loading && sortedResults.length === 0 && (
              <EmptyState
                icon="🔍"
                title="No activities found"
                description="Try a different keyword or category."
              />
            )}

            {sortedResults.length > 0 && (
              <ul className="space-y-3">
                {sortedResults.map((result) => (
                  <ResultRow
                    key={result.placeId}
                    result={result}
                    countryMultiplier={countryMultiplier}
                    currency={currency}
                    alreadyAdded={addedPlaceIds.has(result.placeId)}
                    selectedDayLabel={selectedDay.shortLabel}
                    onAdd={() => handleAdd(result)}
                    onLocate={() => focusOnMap(result.placeId)}
                    isAdding={addingId === result.placeId}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Desktop sticky map column */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 h-[calc(100vh-7rem)]">
            <StopMap
              ref={mapRef}
              apiKey={mapsApiKey}
              cityName={cityName}
              cityLat={cityLat}
              cityLng={cityLng}
              results={mapResults}
              plannedPlaceIds={addedPlaceIds}
              selectedDayLabel={selectedDay.shortLabel}
              isAdding={addingId != null}
              onMarkerAdd={addByPlaceId}
            />
          </div>
        </aside>
      </div>

      {/* Floating Done CTA — always reachable while scrolling */}
      <FloatingActionBar
        helper={
          planned.length === 0
            ? "No activities yet"
            : `${planned.length} activit${planned.length === 1 ? "y" : "ies"} planned${
                totalPlannedCost > 0
                  ? ` · est. ${formatCurrency(totalPlannedCost, currency)}`
                  : ""
              }`
        }
      >
        <Link
          href={`/trips/${tripId}/itinerary`}
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          ← Sections
        </Link>
        <Link
          href={`/trips/${tripId}`}
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          View itinerary →
        </Link>
      </FloatingActionBar>
    </PageContainer>
  );
}
