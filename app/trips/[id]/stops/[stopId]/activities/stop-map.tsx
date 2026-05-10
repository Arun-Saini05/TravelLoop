"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MapResult = {
  placeId: string;
  name: string;
  category: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
};

export type StopMapHandle = {
  /** Pan + bounce a marker so the user can spot a result on the map. */
  focus(placeId: string): void;
};

type Props = {
  apiKey: string;
  cityName: string;
  cityLat: number | null;
  cityLng: number | null;
  results: MapResult[];
  plannedPlaceIds: Set<string>;
  selectedDayLabel: string;
  isAdding: boolean;
  onMarkerAdd: (placeId: string) => void;
};

declare global {
  interface Window {
    google: typeof google;
    initTraveloopMap?: () => void;
  }
}

// ─── Maps loader (single shared promise) ─────────────────────────────────────

let mapsLoadPromise: Promise<void> | null = null;

function loadMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Maps API load timeout")),
      12_000
    );
    const done = () => {
      clearTimeout(timeout);
      resolve();
    };

    if (document.getElementById("gmaps-script")) {
      const poll = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(poll);
          done();
        }
      }, 100);
      return;
    }

    window.initTraveloopMap = done;
    const s = document.createElement("script");
    s.id = "gmaps-script";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&callback=initTraveloopMap&loading=async`;
    s.async = true;
    s.onerror = () => {
      clearTimeout(timeout);
      mapsLoadPromise = null;
      reject(new Error("Maps script failed to load"));
    };
    document.head.appendChild(s);
  });

  return mapsLoadPromise;
}

// Color per Google category keyword → matches the category chips in the list.
const CATEGORY_COLORS: Array<[RegExp, string]> = [
  [/food|restaurant|cafe|bakery|bar/i, "#f59e0b"],
  [/museum|art|historic|cultur/i, "#8b5cf6"],
  [/park|garden|nature|forest/i, "#22c55e"],
  [/shop|market|mall|store/i, "#06b6d4"],
  [/spa|wellness|yoga/i, "#14b8a6"],
  [/night|club/i, "#ec4899"],
  [/adventure|sport|hike/i, "#ef4444"],
];
const DEFAULT_COLOR = "#6366f1";
const PLANNED_COLOR = "#10b981";

function colorFor(category: string | null): string {
  if (!category) return DEFAULT_COLOR;
  for (const [re, c] of CATEGORY_COLORS) if (re.test(category)) return c;
  return DEFAULT_COLOR;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const StopMap = forwardRef<StopMapHandle, Props>(function StopMap(
  {
    apiKey,
    cityName,
    cityLat,
    cityLng,
    results,
    plannedPlaceIds,
    selectedDayLabel,
    isAdding,
    onMarkerAdd,
  },
  ref
) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const cityMarkerRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  // Latest props for use inside Maps event handlers (which capture old refs).
  const stateRef = useRef({
    selectedDayLabel,
    isAdding,
    onMarkerAdd,
    plannedPlaceIds,
  });
  stateRef.current = {
    selectedDayLabel,
    isAdding,
    onMarkerAdd,
    plannedPlaceIds,
  };

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCityCoords = cityLat != null && cityLng != null;
  const center = {
    lat: cityLat ?? 20.5937,
    lng: cityLng ?? 78.9629,
  };
  const initialZoom = hasCityCoords ? 12 : 3;

  // ── Load Maps script ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is missing — set GOOGLE_PLACES_API_KEY.");
      return;
    }
    let cancelled = false;
    loadMapsScript(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load map.");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapElRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(mapElRef.current, {
      center,
      zoom: initialZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
    mapRef.current = map;
    infoRef.current = new window.google.maps.InfoWindow();

    if (hasCityCoords) {
      cityMarkerRef.current = new window.google.maps.Marker({
        position: center,
        map,
        title: cityName,
        zIndex: 1,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#000",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 6,
        },
      });
    }
    // We intentionally only init once — center/zoom updates happen in the
    // sync effect below via `panTo` / `setZoom`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Re-center when city changes ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasCityCoords) return;
    map.panTo(center);
    map.setZoom(initialZoom);
    if (cityMarkerRef.current) {
      cityMarkerRef.current.setPosition(center);
      cityMarkerRef.current.setTitle(cityName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityLat, cityLng, cityName]);

  // ── Sync result markers ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const g = window.google;

    const incoming = new Set<string>();
    let firstMarker: google.maps.Marker | null = null;

    results.forEach((res, idx) => {
      if (res.lat == null || res.lng == null) return;
      incoming.add(res.placeId);

      const planned = stateRef.current.plannedPlaceIds.has(res.placeId);
      const fillColor = planned ? PLANNED_COLOR : colorFor(res.category);
      const stroke = planned ? "#065f46" : "#ffffff";

      let marker = markersRef.current.get(res.placeId);
      if (!marker) {
        marker = new g.maps.Marker({
          position: { lat: res.lat, lng: res.lng },
          map,
          title: res.name,
          label: {
            text: planned ? "✓" : String(idx + 1),
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "11px",
          },
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            fillColor,
            fillOpacity: 1,
            strokeColor: stroke,
            strokeWeight: planned ? 3 : 2,
            scale: 14,
          },
          zIndex: planned ? 5 : 3,
        });
        marker.addListener("click", () => {
          openInfo(res, marker!);
        });
        markersRef.current.set(res.placeId, marker);
      } else {
        marker.setPosition({ lat: res.lat, lng: res.lng });
        marker.setLabel({
          text: planned ? "✓" : String(idx + 1),
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "11px",
        });
        marker.setIcon({
          path: g.maps.SymbolPath.CIRCLE,
          fillColor,
          fillOpacity: 1,
          strokeColor: stroke,
          strokeWeight: planned ? 3 : 2,
          scale: 14,
        });
        marker.setZIndex(planned ? 5 : 3);
      }
      if (!firstMarker) firstMarker = marker;
    });

    // Remove markers that are no longer in results.
    for (const [id, marker] of markersRef.current) {
      if (!incoming.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    // Auto-fit only when we have at least 2 result markers and a centered
    // single result wouldn't be jarring.
    if (incoming.size >= 2) {
      const bounds = new g.maps.LatLngBounds();
      if (hasCityCoords) bounds.extend(center);
      results.forEach((r) => {
        if (r.lat != null && r.lng != null) {
          bounds.extend({ lat: r.lat, lng: r.lng });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 60);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, ready, plannedPlaceIds]);

  function openInfo(res: MapResult, marker: google.maps.Marker) {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!map || !info) return;

    const planned = stateRef.current.plannedPlaceIds.has(res.placeId);
    const dayLabel = stateRef.current.selectedDayLabel;
    const ratingHtml = res.rating != null
      ? `<div style="color:#6b7280;font-size:11px;margin-top:2px">★ ${res.rating.toFixed(1)}${res.category ? ` · ${escapeHtml(res.category)}` : ""}</div>`
      : res.category
        ? `<div style="color:#6b7280;font-size:11px;margin-top:2px">${escapeHtml(res.category)}</div>`
        : "";

    const buttonHtml = planned
      ? `<div style="margin-top:8px;font-size:11px;color:#065f46;font-weight:600">✓ Already planned</div>`
      : `<button id="add-from-map" style="margin-top:8px;display:block;width:100%;padding:6px 10px;background:#000;color:#fff;border:0;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">+ Add to ${escapeHtml(dayLabel)}</button>`;

    info.setContent(
      `<div style="font-family:system-ui,sans-serif;max-width:200px"><div style="font-weight:600;font-size:13px;color:#111">${escapeHtml(res.name)}</div>${ratingHtml}${buttonHtml}</div>`
    );
    info.open({ anchor: marker, map });

    if (!planned) {
      // Wait for the InfoWindow DOM to render then bind the click.
      window.setTimeout(() => {
        const btn = document.getElementById("add-from-map");
        if (!btn) return;
        btn.addEventListener(
          "click",
          () => {
            stateRef.current.onMarkerAdd(res.placeId);
            info.close();
          },
          { once: true }
        );
      }, 50);
    }
  }

  // ── Imperative API: focus a marker by placeId ─────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      focus(placeId: string) {
        const marker = markersRef.current.get(placeId);
        const map = mapRef.current;
        if (!marker || !map) return;
        const pos = marker.getPosition();
        if (pos) map.panTo(pos);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        window.setTimeout(() => marker.setAnimation(null), 1200);
      },
    }),
    []
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
      <div ref={mapElRef} className="h-full w-full" />

      {/* Loading state */}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
            <span className="text-xs">Loading map…</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 px-6">
          <div className="text-center">
            <p className="text-3xl">🗺️</p>
            <p className="mt-1 text-sm font-semibold text-zinc-700">Map unavailable</p>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
          </div>
        </div>
      )}

      {/* No-coords hint */}
      {ready && !error && !hasCityCoords && (
        <div className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-800 shadow-sm">
          City has no coordinates yet — search a few activities to populate the map.
        </div>
      )}

      {/* Adding overlay */}
      {isAdding && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
          Adding…
        </div>
      )}

      {/* Legend */}
      {ready && !error && (
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-zinc-700 shadow-sm backdrop-blur">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Result
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Planned
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-black" />
            City
          </span>
        </div>
      )}
    </div>
  );
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
