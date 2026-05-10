import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

export type ActivityResult = {
  placeId: string;
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  photoRef: string | null;
  lat: number | null;
  lng: number | null;
};

function getMapsApiKey(): string {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) throw new Error("Google Maps API key is not configured.");
  return key;
}

async function fetchPopularActivities(
  cityName: string,
  apiKey: string
): Promise<ActivityResult[]> {
  type SearchTextResponse = {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      primaryTypeDisplayName?: { text?: string };
      formattedAddress?: string;
      rating?: number;
      photos?: Array<{ name?: string }>;
      location?: { latitude?: number; longitude?: number };
    }>;
  };

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.primaryTypeDisplayName,places.formattedAddress,places.rating,places.photos,places.location",
    },
    body: JSON.stringify({
      textQuery: `top tourist attractions and activities in ${cityName}`,
      pageSize: 10,
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
        photoRef: place.photos?.[0]?.name ?? null,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
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

  if (city.length < 2) {
    return Response.json({ activities: [] });
  }

  try {
    const activities = await fetchPopularActivities(city, apiKey);
    return Response.json({ activities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch activities.";
    return Response.json({ error: message }, { status: 500 });
  }
}
