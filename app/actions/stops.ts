"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { MemberRole } from "@/app/generated/prisma/client";

export type StopActionState = {
  error?: string;
  success?: boolean;
  stopId?: string;
};

const EDIT_ROLES: readonly MemberRole[] = ["OWNER", "EDITOR"];

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseFloatOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Look up the trip for a given stop and verify the caller is allowed to edit
 * it (OWNER or EDITOR). Returns trip + stop on success, or an error string.
 */
async function authorizeStop(
  stopId: string,
  userId: string
): Promise<{ tripId: string; stopId: string } | { error: string }> {
  if (!stopId) return { error: "Invalid trip stop." };

  const stop = await db.tripStop.findFirst({
    where: {
      id: stopId,
      trip: {
        members: {
          some: {
            userId,
            role: { in: EDIT_ROLES as unknown as MemberRole[] },
          },
        },
      },
    },
    select: { id: true, tripId: true },
  });

  if (!stop) return { error: "Trip stop not found or you don't have edit access." };
  return { tripId: stop.tripId, stopId: stop.id };
}

async function authorizeTrip(
  tripId: string,
  userId: string
): Promise<{ tripId: string } | { error: string }> {
  if (!tripId) return { error: "Invalid trip." };

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      members: {
        some: {
          userId,
          role: { in: EDIT_ROLES as unknown as MemberRole[] },
        },
      },
    },
    select: { id: true },
  });

  if (!trip) return { error: "Trip not found or you don't have edit access." };
  return { tripId: trip.id };
}

// ─── Date-range validation ───────────────────────────────────────────────────

function fmtRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/**
 * Two date ranges overlap if they share any interior. Touching at endpoints
 * (a.end === b.start) is allowed so back-to-back stops on the same departure
 * day work normally.
 */
function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Validates that `[start, end]` fits inside the trip's date range and does not
 * strictly overlap any sibling stop. Pass `stopIdToIgnore` when editing an
 * existing stop so it isn't compared against itself.
 */
async function validateStopRange(
  tripId: string,
  stopIdToIgnore: string | null,
  start: Date,
  end: Date
): Promise<{ ok: true } | { error: string }> {
  if (end < start) return { error: "End date cannot be before start date." };

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { startDate: true, endDate: true },
  });
  if (!trip) return { error: "Trip not found." };

  if (start < trip.startDate || end > trip.endDate) {
    return {
      error: `Dates must be within the trip's range (${fmtRange(trip.startDate, trip.endDate)}).`,
    };
  }

  const siblings = await db.tripStop.findMany({
    where: {
      tripId,
      ...(stopIdToIgnore ? { id: { not: stopIdToIgnore } } : {}),
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      sortOrder: true,
      city: { select: { name: true } },
    },
  });

  const conflict = siblings.find((s) =>
    rangesOverlap(start, end, s.startDate, s.endDate)
  );

  if (conflict) {
    const label = conflict.title ?? conflict.city.name ?? `Section ${conflict.sortOrder}`;
    return {
      error: `These dates overlap with "${label}" (${fmtRange(conflict.startDate, conflict.endDate)}).`,
    };
  }

  return { ok: true };
}

/**
 * Suggest sensible default dates for a new stop:
 * - No siblings: full trip range.
 * - Otherwise: from the latest sibling's endDate to trip.endDate. If that
 *   collapses to a zero-length range, return a 1-day stop on the last day.
 *   If even that overlaps, the caller should surface the validation error.
 */
async function suggestDefaultsForNewStop(
  tripId: string
): Promise<{ start: Date; end: Date } | { error: string }> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { startDate: true, endDate: true },
  });
  if (!trip) return { error: "Trip not found." };

  const latest = await db.tripStop.findFirst({
    where: { tripId },
    orderBy: { endDate: "desc" },
    select: { endDate: true },
  });

  if (!latest) return { start: trip.startDate, end: trip.endDate };

  const candidateStart = latest.endDate < trip.startDate ? trip.startDate : latest.endDate;
  if (candidateStart > trip.endDate) {
    return { start: trip.endDate, end: trip.endDate };
  }
  return { start: candidateStart, end: trip.endDate };
}

// ─── Add stop ────────────────────────────────────────────────────────────────

export async function addStop(
  _prev: StopActionState,
  formData: FormData
): Promise<StopActionState> {
  const session = await requireSession();

  const tripId = getRequiredString(formData, "tripId");
  const auth = await authorizeTrip(tripId, session.userId);
  if ("error" in auth) return { error: auth.error };

  const placeId = getRequiredString(formData, "selectedPlaceId");
  const placeName = getRequiredString(formData, "selectedPlaceName");
  const placeAddress = getOptionalString(formData, "selectedPlaceAddress");
  const placeRegion = getOptionalString(formData, "selectedPlaceRegion");
  const countryCode = (
    getOptionalString(formData, "selectedPlaceCountryCode") ?? "ZZ"
  ).toUpperCase();
  const countryName =
    getOptionalString(formData, "selectedPlaceCountryName") ?? "Unknown";
  const latitude = parseFloatOrNull(getOptionalString(formData, "selectedPlaceLatitude"));
  const longitude = parseFloatOrNull(getOptionalString(formData, "selectedPlaceLongitude"));

  if (!placeId || !placeName) {
    return { error: "Please pick a destination first." };
  }

  // Pick default dates that don't collide with an existing stop.
  const defaults = await suggestDefaultsForNewStop(tripId);
  if ("error" in defaults) return { error: defaults.error };

  // Validate the suggested defaults; if they overlap, surface a clear error.
  const validation = await validateStopRange(tripId, null, defaults.start, defaults.end);
  if ("error" in validation) {
    return {
      error: `No free dates available for a new section — adjust an existing section first. (${validation.error})`,
    };
  }

  try {
    const newStop = await db.$transaction(async (tx) => {
      await tx.country.upsert({
        where: { code: countryCode },
        update: { name: countryName, lastUpdated: new Date() },
        create: { code: countryCode, name: countryName, lastUpdated: new Date() },
      });

      const city = await tx.city.upsert({
        where: { googlePlaceId: placeId },
        update: {
          name: placeName,
          countryCode,
          region: placeRegion,
          latitude,
          longitude,
          description: placeAddress,
        },
        create: {
          googlePlaceId: placeId,
          name: placeName,
          countryCode,
          region: placeRegion,
          latitude,
          longitude,
          description: placeAddress,
        },
        select: { id: true },
      });

      const lastStop = await tx.tripStop.findFirst({
        where: { tripId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const nextSortOrder = (lastStop?.sortOrder ?? 0) + 1;

      const stop = await tx.tripStop.create({
        data: {
          tripId,
          cityId: city.id,
          title: placeName,
          startDate: defaults.start,
          endDate: defaults.end,
          sortOrder: nextSortOrder,
        },
        select: { id: true },
      });

      return stop;
    });

    revalidatePath(`/trips/${tripId}/itinerary`);
    return { success: true, stopId: newStop.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to add stop.",
    };
  }
}

// ─── Update dates ────────────────────────────────────────────────────────────

export async function updateStopDates(
  _prev: StopActionState,
  formData: FormData
): Promise<StopActionState> {
  const session = await requireSession();

  const stopId = getRequiredString(formData, "stopId");
  const startRaw = getRequiredString(formData, "startDate");
  const endRaw = getRequiredString(formData, "endDate");

  const auth = await authorizeStop(stopId, session.userId);
  if ("error" in auth) return { error: auth.error };

  const startDate = parseDate(startRaw);
  const endDate = parseDate(endRaw);
  if (!startDate || !endDate) return { error: "Provide valid start and end dates." };

  const validation = await validateStopRange(auth.tripId, stopId, startDate, endDate);
  if ("error" in validation) return { error: validation.error };

  try {
    await db.tripStop.update({
      where: { id: stopId },
      data: { startDate, endDate },
    });
    revalidatePath(`/trips/${auth.tripId}/itinerary`);
    return { success: true, stopId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update dates." };
  }
}

// ─── Update notes ────────────────────────────────────────────────────────────

export async function updateStopNotes(
  _prev: StopActionState,
  formData: FormData
): Promise<StopActionState> {
  const session = await requireSession();

  const stopId = getRequiredString(formData, "stopId");
  const notes = getOptionalString(formData, "arrivalNotes");

  const auth = await authorizeStop(stopId, session.userId);
  if ("error" in auth) return { error: auth.error };

  try {
    await db.tripStop.update({
      where: { id: stopId },
      data: { arrivalNotes: notes },
    });
    revalidatePath(`/trips/${auth.tripId}/itinerary`);
    return { success: true, stopId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save notes." };
  }
}

// ─── Update title ────────────────────────────────────────────────────────────

export async function updateStopTitle(
  _prev: StopActionState,
  formData: FormData
): Promise<StopActionState> {
  const session = await requireSession();

  const stopId = getRequiredString(formData, "stopId");
  const title = getOptionalString(formData, "title");

  const auth = await authorizeStop(stopId, session.userId);
  if ("error" in auth) return { error: auth.error };

  try {
    await db.tripStop.update({
      where: { id: stopId },
      data: { title },
    });
    revalidatePath(`/trips/${auth.tripId}/itinerary`);
    return { success: true, stopId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to save title." };
  }
}

// ─── Delete stop ─────────────────────────────────────────────────────────────

export async function deleteStop(
  _prev: StopActionState,
  formData: FormData
): Promise<StopActionState> {
  const session = await requireSession();

  const stopId = getRequiredString(formData, "stopId");
  const auth = await authorizeStop(stopId, session.userId);
  if ("error" in auth) return { error: auth.error };

  const totalStops = await db.tripStop.count({ where: { tripId: auth.tripId } });
  if (totalStops <= 1) {
    return { error: "A trip must have at least one stop. Add another section before removing this one." };
  }

  try {
    await db.tripStop.delete({ where: { id: stopId } });
    revalidatePath(`/trips/${auth.tripId}/itinerary`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete stop." };
  }
}
