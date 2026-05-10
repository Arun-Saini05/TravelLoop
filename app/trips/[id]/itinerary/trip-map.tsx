"use client";

import { useEffect, useRef, useState } from "react";
import { addActivity } from "@/app/actions/activities";
import { useTransition } from "react";

type PlannedPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  date: string | null;
};

type PopularActivity = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
};

type MapClickPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
};

declare global {
  interface Window {
    google: typeof google;
    initTraveloopMap?: () => void;
  }
}

function loadMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  // Already loaded
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Maps API load timeout")), 12000);
    const done = () => { clearTimeout(timeout); resolve(); };

    // Script tag already injected — poll until google.maps is ready
    if (document.getElementById("gmaps-script")) {
      const poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); done(); }
      }, 100);
      return;
    }

    // Fresh injection
    window.initTraveloopMap = done;
    const s = document.createElement("script");
    s.id = "gmaps-script";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initTraveloopMap&loading=async`;
    s.async = true;
    s.onerror = () => { clearTimeout(timeout); reject(new Error("Maps script failed to load")); };
    document.head.appendChild(s);
  });
}

const ACTIVITY_COLORS: Record<string, string> = {
  SIGHTSEEING: "#6366f1", FOOD: "#f59e0b", ADVENTURE: "#ef4444",
  CULTURE: "#8b5cf6", NATURE: "#22c55e", NIGHTLIFE: "#ec4899",
  SHOPPING: "#06b6d4", WELLNESS: "#14b8a6", TRANSPORT: "#64748b", OTHER: "#1d4ed8",
};

export function TripMap({
  cityName, cityLat, cityLng, plannedPins, stopId, mapsApiKey, selectedDate,
  onActivityAdded,
}: {
  cityName: string;
  cityLat: number | null;
  cityLng: number | null;
  plannedPins: PlannedPin[];
  stopId: string;
  mapsApiKey: string;
  selectedDate: string | null;
  onActivityAdded: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const popularMarkersRef = useRef<google.maps.Marker[]>([]);

  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [popularActivities, setPopularActivities] = useState<PopularActivity[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [clickedPlace, setClickedPlace] = useState<MapClickPlace | null>(null);
  const [addingDate, setAddingDate] = useState(selectedDate ?? "");
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"popular" | "add-clicked">("popular");

  // For a country, zoom out further so the whole area is visible
  const defaultLat = cityLat ?? 20.5937;  // India center as sensible default
  const defaultLng = cityLng ?? 78.9629;
  const defaultZoom = cityLat == null ? 4 : Math.abs(cityLat) > 60 ? 5 : 12;

  // Load Maps API
  useEffect(() => {
    if (!mapsApiKey) {
      setMapError("Google Maps API key is not configured.");
      return;
    }
    loadMapsScript(mapsApiKey)
      .then(() => setReady(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load Google Maps.";
        setMapError(msg);
      });
  }, [mapsApiKey]);

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: defaultZoom,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });

    mapInstanceRef.current = map;

    // Click on map → reverse-geocode & show add panel
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setClickedPlace({
            name: results[0].address_components?.[0]?.long_name ?? results[0].formatted_address,
            address: results[0].formatted_address,
            lat, lng,
            placeId: results[0].place_id ?? `manual-${lat}-${lng}`,
          });
          setPanel("add-clicked");
        }
      });
    });

    // Load popular activities
    setLoadingPopular(true);
    fetch(`/api/places/activities?city=${encodeURIComponent(cityName)}`, { cache: "no-store" })
      .then(r => r.json())
      .then((data: { activities?: PopularActivity[] }) => {
        setPopularActivities(data.activities ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingPopular(false));
  }, [ready, defaultLat, defaultLng, cityName]);

  // Render planned activity markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    plannedPins.forEach((pin, idx) => {
      const color = ACTIVITY_COLORS[pin.type] ?? "#1d4ed8";
      const marker = new window.google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapInstanceRef.current!,
        title: pin.name,
        label: {
          text: String(idx + 1),
          color: "#fff",
          fontWeight: "bold",
          fontSize: "12px",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 16,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;font-size:13px;max-width:160px">
          <strong>${pin.name}</strong>
          ${pin.date ? `<br/><span style="color:#6b7280;font-size:11px">${pin.date}</span>` : ""}
        </div>`,
      });
      marker.addListener("click", () => infoWindow.open(mapInstanceRef.current!, marker));
      markersRef.current.push(marker);
    });
  }, [plannedPins, ready]);

  // Render popular activity markers (lighter style)
  useEffect(() => {
    if (!mapInstanceRef.current || !popularActivities.length) return;
    popularMarkersRef.current.forEach(m => m.setMap(null));
    popularMarkersRef.current = [];

    popularActivities.forEach(act => {
      if (act.lat == null || act.lng == null) return;
      const marker = new window.google.maps.Marker({
        position: { lat: act.lat, lng: act.lng },
        map: mapInstanceRef.current!,
        title: act.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#fbbf24",
          fillOpacity: 0.7,
          strokeColor: "#f59e0b",
          strokeWeight: 1.5,
          scale: 10,
        },
      });
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;font-size:12px;max-width:160px">
          <strong>${act.name}</strong>
          ${act.category ? `<br/><span style="color:#6b7280">${act.category}</span>` : ""}
          ${act.rating ? `<br/>⭐ ${act.rating}` : ""}
        </div>`,
      });
      marker.addListener("click", () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });
      popularMarkersRef.current.push(marker);
    });
  }, [popularActivities, ready]);

  // Keep addingDate in sync with selectedDate prop
  useEffect(() => {
    if (selectedDate) setAddingDate(selectedDate);
  }, [selectedDate]);

  function submitFromMap(act: PopularActivity) {
    if (!addingDate) return;
    const fd = new FormData();
    fd.set("stopId", stopId);
    fd.set("name", act.name);
    fd.set("scheduledDate", addingDate);
    fd.set("googlePlaceId", act.placeId);
    fd.set("category", act.category ?? "");
    fd.set("address", act.address ?? "");
    startTransition(async () => {
      await addActivity({}, fd);
      onActivityAdded();
    });
  }

  function submitClickedPlace() {
    if (!clickedPlace || !addingDate) return;
    const fd = new FormData();
    fd.set("stopId", stopId);
    fd.set("name", clickedPlace.name);
    fd.set("scheduledDate", addingDate);
    fd.set("googlePlaceId", clickedPlace.placeId);
    fd.set("address", clickedPlace.address);
    startTransition(async () => {
      await addActivity({}, fd);
      setClickedPlace(null);
      setPanel("popular");
      onActivityAdded();
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Map */}
      <div className="relative flex-shrink-0" style={{ height: "340px" }}>
        {!ready && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              <span className="text-xs">Loading map…</span>
            </div>
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 px-4">
            <div className="text-center">
              <p className="text-2xl">🗺️</p>
              <p className="mt-1 text-xs font-medium text-red-700">{mapError}</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
        {ready && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
            Click map to add a place
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 border-y border-zinc-100 px-3 py-2">
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span className="inline-block h-3 w-3 rounded-full bg-indigo-500" /> Planned
        </span>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-400 opacity-70" /> Popular
        </span>
        {plannedPins.length > 0 && (
          <span className="ml-auto text-xs font-medium text-zinc-700">
            {plannedPins.length} pinned
          </span>
        )}
      </div>

      {/* Scrollable panel beneath map */}
      <div className="flex-1 overflow-y-auto">
        {/* Date selector */}
        <div className="border-b border-zinc-100 px-3 py-2">
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Adding activity for date:
          </label>
          <input
            type="date"
            value={addingDate}
            onChange={e => setAddingDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100">
          <button
            type="button"
            onClick={() => setPanel("popular")}
            className={`flex-1 py-2 text-xs font-medium transition ${panel === "popular" ? "border-b-2 border-black text-black" : "text-zinc-500"}`}
          >
            🌟 Popular
          </button>
          <button
            type="button"
            onClick={() => setPanel("add-clicked")}
            className={`flex-1 py-2 text-xs font-medium transition ${panel === "add-clicked" ? "border-b-2 border-black text-black" : "text-zinc-500"}`}
          >
            📍 Map Click
          </button>
        </div>

        {/* Popular panel */}
        {panel === "popular" && (
          <div className="p-3">
            {loadingPopular ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : popularActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                No popular activities found for {cityName}.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {popularActivities.map(act => (
                  <li key={act.placeId}>
                    <button
                      type="button"
                      disabled={isPending || !addingDate}
                      onClick={() => submitFromMap(act)}
                      className="group flex w-full items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left hover:border-zinc-400 hover:bg-white disabled:opacity-50"
                    >
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-900">{act.name}</p>
                        <p className="truncate text-[10px] text-zinc-500">
                          {[act.category, act.rating ? `⭐ ${act.rating}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </span>
                      <span className="flex-shrink-0 text-[10px] text-zinc-400 group-hover:text-black">
                        {isPending ? "…" : "+ Add"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Map-click panel */}
        {panel === "add-clicked" && (
          <div className="p-3">
            {clickedPlace ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-900">{clickedPlace.name}</p>
                  <p className="mt-0.5 text-[10px] text-blue-600">{clickedPlace.address}</p>
                </div>
                {!addingDate && (
                  <p className="text-xs text-red-600">Please select a date above first.</p>
                )}
                <button
                  type="button"
                  disabled={isPending || !addingDate}
                  onClick={submitClickedPlace}
                  className="w-full rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? "Adding…" : "Add to Itinerary"}
                </button>
                <button
                  type="button"
                  onClick={() => setClickedPlace(null)}
                  className="w-full text-xs text-zinc-500 underline"
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-zinc-500">
                Click anywhere on the map to select a location.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
