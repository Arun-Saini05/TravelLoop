"use client";

import { useActionState, useEffect, useState } from "react";
import { createTrip, type CreateTripActionState } from "@/app/actions/trips";

type PlaceSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string | null;
};

type ActivitySuggestion = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
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

type PlacesResponse = {
  places: PlaceSuggestion[];
  activities: ActivitySuggestion[];
  error?: string;
};

const initialState: CreateTripActionState = {};

export function NewTripForm() {
  const [state, formAction, pending] = useActionState(createTrip, initialState);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [activities, setActivities] = useState<ActivitySuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingPlaceDetails, setLoadingPlaceDetails] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setPlacesError(null);

        const response = await fetch(
          `/api/places/popular?query=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = (await response.json()) as PlacesResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Failed to fetch suggestions.");
        }

        setPlaces(data.places ?? []);
        setActivities(data.activities ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPlaces([]);
        setActivities([]);
        setPlacesError(error instanceof Error ? error.message : "Unable to load places.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  async function handleSelectPlace(place: PlaceSuggestion) {
    setLoadingPlaceDetails(true);
    setPlacesError(null);

    try {
      const response = await fetch(
        `/api/places/popular?placeId=${encodeURIComponent(place.placeId)}`,
        {
          cache: "no-store",
        }
      );
      const data = (await response.json()) as {
        place?: SelectedPlace;
        error?: string;
      };

      if (!response.ok || !data.place) {
        throw new Error(data.error ?? "Failed to load selected place details.");
      }

      setSelectedPlace(data.place);
      setQuery(data.place.name);
      setPlaces([]);
    } catch (error) {
      setSelectedPlace(null);
      setPlacesError(
        error instanceof Error ? error.message : "Could not load selected place."
      );
    } finally {
      setLoadingPlaceDetails(false);
    }
  }

  function onQueryChange(value: string) {
    if (value.trim().length < 2) {
      setPlaces([]);
      setActivities([]);
      setPlacesError(null);
    }

    setQuery(value);
    setSelectedPlace(null);
  }

  return (
    <form action={formAction} className="space-y-6">
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
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
        />
      </div>

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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="destination" className="block text-sm font-medium text-zinc-700">
          Select a Place
        </label>
        <input
          id="destination"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search city or destination"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
        />

        {loadingSuggestions ? (
          <p className="text-xs text-zinc-500">Loading suggestions...</p>
        ) : null}

        {loadingPlaceDetails ? (
          <p className="text-xs text-zinc-500">Loading selected place details...</p>
        ) : null}

        {placesError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {placesError}
          </p>
        ) : null}

        {places.length > 0 ? (
          <ul className="max-h-64 space-y-2 overflow-auto rounded-lg border border-zinc-200 p-2">
            {places.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full rounded-md px-3 py-2 text-left transition hover:bg-zinc-100"
                >
                  <p className="text-sm font-medium text-zinc-900">{place.mainText}</p>
                  {place.secondaryText ? (
                    <p className="text-xs text-zinc-600">{place.secondaryText}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selectedPlace ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Selected: {selectedPlace.name}
            {selectedPlace.countryName ? `, ${selectedPlace.countryName}` : ""}
          </p>
        ) : null}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Suggestions for Places to Visit / Activities to Perform
        </h2>
        {activities.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">
            Start typing a destination to get popular activity ideas.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {activities.map((activity) => (
              <li
                key={activity.placeId}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2"
              >
                <p className="text-sm font-medium text-zinc-900">{activity.name}</p>
                <p className="text-xs text-zinc-600">
                  {[activity.category, activity.address].filter(Boolean).join(" | ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <input
        type="hidden"
        name="selectedPlaceId"
        value={selectedPlace?.placeId ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceName"
        value={selectedPlace?.name ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceAddress"
        value={selectedPlace?.address ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceRegion"
        value={selectedPlace?.region ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceCountryCode"
        value={selectedPlace?.countryCode ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceCountryName"
        value={selectedPlace?.countryName ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceLatitude"
        value={selectedPlace?.latitude?.toString() ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="selectedPlaceLongitude"
        value={selectedPlace?.longitude?.toString() ?? ""}
        readOnly
      />

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !selectedPlace}
        className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving trip..." : "Save Trip"}
      </button>
    </form>
  );
}
