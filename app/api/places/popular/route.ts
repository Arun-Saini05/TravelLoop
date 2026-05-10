import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

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

type PlaceDetailsResult = {
  placeId: string;
  name: string;
  address: string | null;
  region: string | null;
  countryCode: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
};

function getMapsApiKey(): string {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    throw new Error("Google Maps API key is not configured.");
  }

  return key;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

async function fetchPlaceSuggestions(query: string, apiKey: string): Promise<PlaceSuggestion[]> {
  type AutocompleteResponse = {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  const data = await fetchJson<AutocompleteResponse>(
    `${GOOGLE_PLACES_BASE_URL}/places:autocomplete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["(cities)"],
      }),
    }
  );

  return (data.suggestions ?? [])
    .map((item) => {
      const prediction = item.placePrediction;
      const placeId = prediction?.placeId;
      const label = prediction?.text?.text;
      const mainText = prediction?.structuredFormat?.mainText?.text ?? label;
      const secondaryText = prediction?.structuredFormat?.secondaryText?.text ?? null;

      if (!placeId || !label || !mainText) {
        return null;
      }

      return {
        placeId,
        label,
        mainText,
        secondaryText,
      } satisfies PlaceSuggestion;
    })
    .filter((value): value is PlaceSuggestion => value !== null);
}

async function fetchActivitySuggestions(
  query: string,
  apiKey: string
): Promise<ActivitySuggestion[]> {
  type SearchTextResponse = {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      primaryTypeDisplayName?: { text?: string };
      formattedAddress?: string;
    }>;
  };

  const data = await fetchJson<SearchTextResponse>(
    `${GOOGLE_PLACES_BASE_URL}/places:searchText`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.primaryTypeDisplayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: `popular activities in ${query}`,
        pageSize: 6,
      }),
    }
  );

  return (data.places ?? [])
    .map((place) => {
      const placeId = place.id;
      const name = place.displayName?.text;

      if (!placeId || !name) {
        return null;
      }

      return {
        placeId,
        name,
        category: place.primaryTypeDisplayName?.text ?? null,
        address: place.formattedAddress ?? null,
      } satisfies ActivitySuggestion;
    })
    .filter((value): value is ActivitySuggestion => value !== null);
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetailsResult> {
  type PlaceDetailsResponse = {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
    }>;
  };

  const data = await fetchJson<PlaceDetailsResponse>(
    `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,addressComponents,location",
      },
    }
  );

  const components = data.addressComponents ?? [];
  const countryComponent = components.find((component) =>
    component.types?.includes("country")
  );
  const regionComponent =
    components.find((component) =>
      component.types?.includes("administrative_area_level_1")
    ) ??
    components.find((component) => component.types?.includes("locality")) ??
    null;

  return {
    placeId: data.id ?? placeId,
    name: data.displayName?.text ?? "",
    address: data.formattedAddress ?? null,
    region: regionComponent?.longText ?? null,
    countryCode: countryComponent?.shortText?.toUpperCase() ?? null,
    countryName: countryComponent?.longText ?? null,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apiKey = "";

  try {
    apiKey = getMapsApiKey();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing Google Maps API key.";
    return Response.json({ error: message }, { status: 500 });
  }

  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId")?.trim() ?? "";
  const query = url.searchParams.get("query")?.trim() ?? "";

  if (placeId) {
    try {
      const place = await fetchPlaceDetails(placeId, apiKey);

      if (!place.name) {
        return Response.json({ error: "Place not found." }, { status: 404 });
      }

      return Response.json({ place });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load place details.";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  if (query.length < 2) {
    return Response.json({ places: [], activities: [] });
  }

  try {
    const [places, activities] = await Promise.all([
      fetchPlaceSuggestions(query, apiKey),
      fetchActivitySuggestions(query, apiKey).catch(() => []),
    ]);

    return Response.json({ places, activities });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch place suggestions.";
    return Response.json({ error: message }, { status: 500 });
  }
}
