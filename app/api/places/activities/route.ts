import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { googlePriceLevelEnumToInt } from "@/lib/pricing";

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

export type ActivityResult = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  userRatingCount: number | null;
  photoRef: string | null;
  lat: number | null;
  lng: number | null;
  /** Google `priceLevel` mapped to 0..4 (null = unknown). */
  priceLevel: number | null;
};

function getMapsApiKey(): string {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) throw new Error("Google Maps API key is not configured.");
  return key;
}

async function fetchActivities(
  textQuery: string,
  apiKey: string
): Promise<ActivityResult[]> {
  type SearchTextResponse = {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      primaryTypeDisplayName?: { text?: string };
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
      priceLevel?: string;
      photos?: Array<{ name?: string }>;
      location?: { latitude?: number; longitude?: number };
    }>;
  };

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.primaryTypeDisplayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.photos",
        "places.location",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery,
      pageSize: 15,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as SearchTextResponse;

  return (data.places ?? [])
    .map((place) => {
      const placeId = place.id;
      const name = place.displayName?.text;
      if (!placeId || !name) return null;

      return {
        placeId,
        name,
        category: place.primaryTypeDisplayName?.text ?? null,
        address: place.formattedAddress ?? null,
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
        photoRef: place.photos?.[0]?.name ?? null,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
        priceLevel: googlePriceLevelEnumToInt(place.priceLevel ?? null),
      } satisfies ActivityResult;
    })
    .filter((v): v is ActivityResult => v !== null);
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
  const city = url.searchParams.get("city")?.trim() ?? "";
  const query = url.searchParams.get("query")?.trim() ?? "";

  if (!city) {
    return Response.json({ activities: [] });
  }

  // If a free-text query is provided, scope it to the destination city; otherwise
  // fall back to "top tourist attractions in <city>".
  const textQuery = query
    ? `${query} in ${city}`
    : `top tourist attractions and activities in ${city}`;

  try {
    const activities = await fetchActivities(textQuery, apiKey);
    return Response.json({ activities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch activities.";
    return Response.json({ error: message }, { status: 500 });
  }
}
