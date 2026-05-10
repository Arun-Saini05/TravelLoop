"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type CreateTripActionState = {
  error?: string;
};

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDecimalLike(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createTrip(
  _previousState: CreateTripActionState,
  formData: FormData
): Promise<CreateTripActionState> {
  const session = await requireSession();

  const tripName = getRequiredString(formData, "tripName");
  const startDateRaw = getRequiredString(formData, "startDate");
  const endDateRaw = getRequiredString(formData, "endDate");
  const selectedPlaceId = getRequiredString(formData, "selectedPlaceId");
  const selectedPlaceName = getRequiredString(formData, "selectedPlaceName");
  const selectedPlaceAddress = getOptionalString(formData, "selectedPlaceAddress");
  const selectedPlaceRegion = getOptionalString(formData, "selectedPlaceRegion");
  const selectedPlaceCountryCode = (
    getOptionalString(formData, "selectedPlaceCountryCode") ?? "ZZ"
  ).toUpperCase();
  const selectedPlaceCountryName =
    getOptionalString(formData, "selectedPlaceCountryName") ?? "Unknown";
  const latitude = parseDecimalLike(getOptionalString(formData, "selectedPlaceLatitude"));
  const longitude = parseDecimalLike(getOptionalString(formData, "selectedPlaceLongitude"));

  if (!tripName) {
    return { error: "Trip name is required." };
  }

  if (!selectedPlaceId || !selectedPlaceName) {
    return { error: "Please select a destination from the suggestions." };
  }

  const startDate = parseDate(startDateRaw);
  const endDate = parseDate(endDateRaw);

  if (!startDate || !endDate) {
    return { error: "Please provide valid start and end dates." };
  }

  if (endDate < startDate) {
    return { error: "End date cannot be earlier than start date." };
  }

  const trip = await db.$transaction(async (tx) => {
    await tx.country.upsert({
      where: { code: selectedPlaceCountryCode },
      update: {
        name: selectedPlaceCountryName,
        lastUpdated: new Date(),
      },
      create: {
        code: selectedPlaceCountryCode,
        name: selectedPlaceCountryName,
        lastUpdated: new Date(),
      },
    });

    const city = await tx.city.upsert({
      where: { googlePlaceId: selectedPlaceId },
      update: {
        name: selectedPlaceName,
        countryCode: selectedPlaceCountryCode,
        region: selectedPlaceRegion,
        latitude,
        longitude,
        description: selectedPlaceAddress,
      },
      create: {
        googlePlaceId: selectedPlaceId,
        name: selectedPlaceName,
        countryCode: selectedPlaceCountryCode,
        region: selectedPlaceRegion,
        latitude,
        longitude,
        description: selectedPlaceAddress,
      },
      select: { id: true },
    });

    const createdTrip = await tx.trip.create({
      data: {
        ownerId: session.userId,
        name: tripName,
        startDate,
        endDate,
        status: "PLANNED",
      },
      select: {
        id: true,
      },
    });

    await tx.tripMember.create({
      data: {
        tripId: createdTrip.id,
        userId: session.userId,
        role: "OWNER",
      },
    });

    await tx.tripStop.create({
      data: {
        tripId: createdTrip.id,
        cityId: city.id,
        title: selectedPlaceName,
        startDate,
        endDate,
        sortOrder: 1,
      },
    });

    return createdTrip;
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard?createdTrip=${trip.id}`);
}
