"use client";

import { useActionState, useEffect, useState } from "react";
import { createTrip, type CreateTripActionState } from "@/app/actions/trips";

type PlaceSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string | null;
  placeType: string;
};

type PopularPlace = {
  placeId: string;
  name: string;
  country: string | null;
  description: string | null;
  photoRef: string | null;
};

type SelectedPlace = {
  placeId: string;
  name: string;
  address: string | null;
  region: string | null;
  countryCode: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PlacesSearchResponse = {
  places: PlaceSuggestion[];
  error?: string;
};

const POPULAR_DESTINATIONS: PopularPlace[] = [
  { placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ", name: "Paris", country: "France", description: "City of lights & romance", photoRef: null },
  { placeId: "ChIJpTvG15DL1IkRd8S0KlBVNTI", name: "Tokyo", country: "Japan", description: "Neon lights & ancient temples", photoRef: null },
  { placeId: "ChIJyWEHuEmuEmsRm9hTQqQk6eE", name: "Barcelona", country: "Spain", description: "Gaudí, beaches & tapas", photoRef: null },
  { placeId: "ChIJOwg_06VPwokRYv534QaPC8g", name: "New York", country: "USA", description: "The city that never sleeps", photoRef: null },
  { placeId: "ChIJq6qq6jauEmsRJAf7FjriKrg", name: "Rome", country: "Italy", description: "The eternal city", photoRef: null },
  { placeId: "ChIJSTKCCzZa4joRljkkg0zGAoo", name: "Dubai", country: "UAE", description: "Luxury, desert & skyline", photoRef: null },
  { placeId: "ChIJP3Sa8ziYEmsRUKgyFmh9AQM", name: "Sydney", country: "Australia", description: "Harbour, surf & sunshine", photoRef: null },
  { placeId: "ChIJAVkDPzdOqEcRcDteW0YgIQU", name: "Amsterdam", country: "Netherlands", description: "Canals, bikes & art", photoRef: null },
];

const initialState: CreateTripActionState = {};

export function NewTripForm() {
  const [state, formAction, pending] = useActionState(createTrip, initialState);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Debounced search for typed queries
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setPlacesError(null);

        const response = await fetch(
          `/api/places/popular?query=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, cache: "no-store" }
        );

        const data = (await response.json()) as PlacesSearchResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Failed to fetch suggestions.");
        }

        setSearchResults(data.places ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSearchResults([]);
        setPlacesError(error instanceof Error ? error.message : "Unable to load places.");
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  async function handleSelectSuggestion(place: PlaceSuggestion) {
    await resolvePlace(place.placeId, place.mainText);
  }

  async function handleSelectPopular(popular: PopularPlace) {
    await resolvePlace(popular.placeId, popular.name);
  }

  async function resolvePlace(placeId: string, fallbackName: string) {
    setLoadingPlaceDetails(true);
    setPlacesError(null);

    try {
      const response = await fetch(
        `/api/places/popular?placeId=${encodeURIComponent(placeId)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as { place?: SelectedPlace; error?: string };

      if (!response.ok || !data.place) {
        throw new Error(data.error ?? "Failed to load selected place details.");
      }

      setSelectedPlace(data.place);
      setQuery(data.place.name);
      setSearchResults([]);
    } catch (error) {
      // Fallback: keep the popular place with minimal data so the user can proceed
      setSelectedPlace({
        placeId,
        name: fallbackName,
        address: null,
        region: null,
        countryCode: null,
        countryName: null,
        latitude: null,
        longitude: null,
      });
      setQuery(fallbackName);
      setSearchResults([]);
      setPlacesError(error instanceof Error ? error.message : "Could not load place details.");
    } finally {
      setLoadingPlaceDetails(false);
    }
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setSelectedPlace(null);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setPlacesError(null);
    }
  }

  const showPopularGrid = !selectedPlace && query.trim().length < 2;

  return (
    <form action={formAction} className="space-y-6">
      {/* Trip Name */}
      <div className="space-y-1">
        <label htmlFor="tripName" className="block text-sm font-medium text-zinc-700">
          Trip Name
        </label>
        <input
          id="tripName"
          name="tripName"
          type="text"
          required
          placeholder="Summer in Spain"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700">
            End Date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      {/* Destination search */}
      <div className="space-y-2">
        <label htmlFor="destination" className="block text-sm font-medium text-zinc-700">
          Destination
        </label>
        <p className="text-xs text-zinc-400">Search for a city, state, region, or country</p>
        <div className="relative">
          <input
            id="destination"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g. Tokyo, California, Southeast Asia…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          {(loadingSuggestions || loadingPlaceDetails) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              {loadingPlaceDetails ? "Loading…" : "Searching…"}
            </span>
          )}
        </div>

        {placesError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {placesError}
          </p>
        )}

        {/* Autocomplete dropdown */}
        {searchResults.length > 0 && (
          <ul className="max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
            {searchResults.map((place) => {
              const badgeStyles: Record<string, string> = {
                city:    "bg-blue-50 text-blue-700 border-blue-200",
                state:   "bg-violet-50 text-violet-700 border-violet-200",
                country: "bg-emerald-50 text-emerald-700 border-emerald-200",
                region:  "bg-amber-50 text-amber-700 border-amber-200",
                place:   "bg-zinc-100 text-zinc-600 border-zinc-200",
              };
              const badgeClass = badgeStyles[place.placeType] ?? badgeStyles.place;
              const badgeEmoji: Record<string, string> = {
                city: "🏙️", state: "🗺️", country: "🌍", region: "📍", place: "📌",
              };
              const emoji = badgeEmoji[place.placeType] ?? "📌";

              return (
                <li key={place.placeId}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(place)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50"
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{place.mainText}</p>
                      {place.secondaryText && (
                        <p className="text-xs text-zinc-500">{place.secondaryText}</p>
                      )}
                    </span>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${badgeClass}`}>
                      {place.placeType}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Selected confirmation */}
        {selectedPlace && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-sm font-medium text-emerald-800">
              ✓ {selectedPlace.name}
              {selectedPlace.countryName ? `, ${selectedPlace.countryName}` : ""}
            </p>
            <button
              type="button"
              onClick={() => { setSelectedPlace(null); setQuery(""); }}
              className="text-xs text-emerald-600 underline hover:text-emerald-800"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Popular Places grid — shown when nothing is selected yet */}
      {showPopularGrid && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            🌍 Popular Destinations
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest.placeId}
                type="button"
                onClick={() => handleSelectPopular(dest)}
                className="group flex flex-col items-start rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition hover:border-zinc-400 hover:bg-white hover:shadow-sm"
              >
                <span className="mb-1.5 text-2xl">
                  {getDestinationEmoji(dest.name)}
                </span>
                <p className="text-sm font-semibold text-zinc-900 group-hover:text-black">
                  {dest.name}
                </p>
                <p className="text-xs text-zinc-500">{dest.country}</p>
                {dest.description && (
                  <p className="mt-1 text-xs text-zinc-400 leading-snug">
                    {dest.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="selectedPlaceId" value={selectedPlace?.placeId ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceName" value={selectedPlace?.name ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceAddress" value={selectedPlace?.address ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceRegion" value={selectedPlace?.region ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceCountryCode" value={selectedPlace?.countryCode ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceCountryName" value={selectedPlace?.countryName ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceLatitude" value={selectedPlace?.latitude?.toString() ?? ""} readOnly />
      <input type="hidden" name="selectedPlaceLongitude" value={selectedPlace?.longitude?.toString() ?? ""} readOnly />

      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selectedPlace}
        className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving trip…" : "Save Trip & Build Itinerary →"}
      </button>
    </form>
  );
}

function getDestinationEmoji(name: string): string {
  const map: Record<string, string> = {
    Paris: "🗼", Tokyo: "🗾", Barcelona: "🏟️", "New York": "🗽",
    Rome: "🏛️", Dubai: "🌆", Sydney: "🦘", Amsterdam: "🚲",
  };
  return map[name] ?? "🌍";
}
