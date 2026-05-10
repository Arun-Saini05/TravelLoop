"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { estimatedUsd } from "@/lib/pricing";

export type AddActivityActionState = {
  error?: string;
  success?: boolean;
};

export async function addActivity(
  _prev: AddActivityActionState,
  formData: FormData
): Promise<AddActivityActionState> {
  const session = await requireSession();

  const stopId = formData.get("stopId") as string;
  const name = (formData.get("name") as string)?.trim();
  const scheduledDateRaw = formData.get("scheduledDate") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const estimatedCostRaw = formData.get("estimatedCost") as string;
  const googlePlaceId = (formData.get("googlePlaceId") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!stopId) return { error: "Invalid trip stop." };
  if (!name) return { error: "Activity name is required." };
  if (!scheduledDateRaw) return { error: "Please select a date for this activity." };

  const scheduledDate = new Date(scheduledDateRaw);
  if (Number.isNaN(scheduledDate.getTime())) return { error: "Invalid date." };

  const estimatedCost = estimatedCostRaw
    ? Number.parseFloat(estimatedCostRaw)
    : null;

  // Verify the stop belongs to the session user
  const stop = await db.tripStop.findFirst({
    where: {
      id: stopId,
      trip: { members: { some: { userId: session.userId } } },
    },
    select: { id: true, cityId: true, tripId: true },
  });

  if (!stop) return { error: "Trip stop not found or access denied." };

  // Upsert activity (create if new, reuse if Google place already exists)
  let activity = googlePlaceId
    ? await db.activity.findUnique({ where: { googlePlaceId }, select: { id: true } })
    : null;

  if (!activity) {
    activity = await db.activity.create({
      data: {
        googlePlaceId: googlePlaceId ?? `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        cityId: stop.cityId,
        name,
        description: address,
        type: mapCategoryToType(category),
      },
      select: { id: true },
    });
  }

  // Find current max sortOrder for the stop
  const lastAssignment = await db.tripStopActivity.findFirst({
    where: { stopId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (lastAssignment?.sortOrder ?? -1) + 1;

  await db.tripStopActivity.create({
    data: {
      stopId,
      activityId: activity.id,
      scheduledDate,
      dayNumber: null,
      notes: notes ?? null,
      estimatedCost: estimatedCost ?? null,
      sortOrder: nextSortOrder,
    },
  });

  revalidatePath(`/trips/${stop.tripId}/itinerary`);
  return { success: true };
}

function mapCategoryToType(category: string | null): import("@/app/generated/prisma").ActivityType {
  if (!category) return "OTHER";
  const lower = category.toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("cafe")) return "FOOD";
  if (lower.includes("museum") || lower.includes("art") || lower.includes("historic")) return "CULTURE";
  if (lower.includes("park") || lower.includes("garden") || lower.includes("nature")) return "NATURE";
  if (lower.includes("shop")) return "SHOPPING";
  if (lower.includes("spa") || lower.includes("wellness")) return "WELLNESS";
  if (lower.includes("bar") || lower.includes("night")) return "NIGHTLIFE";
  if (lower.includes("adventure") || lower.includes("sport")) return "ADVENTURE";
  return "SIGHTSEEING";
}

// ─── Step 3: add an activity from a Google Places search result ──────────────

export type PlannedActivityDTO = {
  /** TripStopActivity.id (the assignment row id). */
  id: string;
  name: string;
  type: import("@/app/generated/prisma").ActivityType;
  scheduledDate: string | null;
  estimatedCost: number | null;
  googlePlaceId: string;
};

export type AddActivityFromPlaceState = {
  error?: string;
  success?: boolean;
  /** Approximate USD cost that was stored on the new TripStopActivity. */
  estimatedCostUsd?: number;
  /** The newly-created assignment, suitable for appending to the client list. */
  assignment?: PlannedActivityDTO;
};

/**
 * Adds an activity to a stop given a Google Places result. Computes an
 * approximate USD cost from `priceLevel × Country.costMultiplier` and stores
 * it on both the cached `Activity` row (when newly created) and the new
 * `TripStopActivity` assignment.
 */
export async function addActivityFromPlace(
  _prev: AddActivityFromPlaceState,
  formData: FormData
): Promise<AddActivityFromPlaceState> {
  const session = await requireSession();

  const stopId = (formData.get("stopId") as string)?.trim();
  const googlePlaceId = (formData.get("googlePlaceId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const photoRef = (formData.get("photoRef") as string)?.trim() || null;
  const priceLevelRaw = (formData.get("priceLevel") as string)?.trim();
  const ratingRaw = (formData.get("rating") as string)?.trim();
  const scheduledDateRaw = (formData.get("scheduledDate") as string)?.trim();

  if (!stopId) return { error: "Invalid trip stop." };
  if (!googlePlaceId) return { error: "Missing Google place id." };
  if (!name) return { error: "Activity name is required." };

  const priceLevel = priceLevelRaw === "" || priceLevelRaw == null
    ? null
    : Number.parseInt(priceLevelRaw, 10);
  const rating = ratingRaw ? Number.parseFloat(ratingRaw) : null;

  // Verify access + load the stop's city + country multiplier in one go.
  const stop = await db.tripStop.findFirst({
    where: {
      id: stopId,
      trip: {
        members: {
          some: {
            userId: session.userId,
            role: { in: ["OWNER", "EDITOR"] },
          },
        },
      },
    },
    select: {
      id: true,
      cityId: true,
      tripId: true,
      startDate: true,
      city: {
        select: {
          country: { select: { costMultiplier: true } },
        },
      },
    },
  });

  if (!stop) return { error: "Trip stop not found or access denied." };

  const countryMultiplier = stop.city.country?.costMultiplier ?? null;
  const mappedType = mapCategoryToType(category);
  // Estimate uses a type-based fallback when Google didn't return a price
  // level, so museums / parks / sights still get a sensible per-country cost
  // instead of $0 / "—".
  const { usd: computedCostUsd } = estimatedUsd(
    Number.isFinite(priceLevel as number) ? (priceLevel as number) : null,
    mappedType,
    countryMultiplier
  );

  // Upsert the cached Activity. If we already have it cached, only top up the
  // priceLevel/computedCost fields when they were previously unknown.
  const existing = await db.activity.findUnique({
    where: { googlePlaceId },
    select: { id: true, googlePriceLevel: true, computedCostUsd: true },
  });

  let activityId: string;
  if (existing) {
    activityId = existing.id;
    const patch: { googlePriceLevel?: number; computedCostUsd?: number } = {};
    if (existing.googlePriceLevel == null && priceLevel != null && Number.isFinite(priceLevel)) {
      patch.googlePriceLevel = priceLevel;
    }
    if ((existing.computedCostUsd ?? 0) === 0 && computedCostUsd > 0) {
      patch.computedCostUsd = computedCostUsd;
    }
    if (Object.keys(patch).length > 0) {
      await db.activity.update({ where: { id: existing.id }, data: patch });
    }
  } else {
    const created = await db.activity.create({
      data: {
        googlePlaceId,
        cityId: stop.cityId,
        name,
        description: address,
        type: mappedType,
        googlePriceLevel:
          priceLevel != null && Number.isFinite(priceLevel) ? priceLevel : null,
        computedCostUsd,
        photoRef,
        popularityScore: rating != null && Number.isFinite(rating) ? Math.round(rating * 20) : 0,
      },
      select: { id: true },
    });
    activityId = created.id;
  }

  // Find the next sortOrder on the stop.
  const lastAssignment = await db.tripStopActivity.findFirst({
    where: { stopId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (lastAssignment?.sortOrder ?? -1) + 1;

  const scheduledDate = scheduledDateRaw
    ? new Date(scheduledDateRaw)
    : stop.startDate;
  const safeScheduledDate = Number.isNaN(scheduledDate.getTime())
    ? stop.startDate
    : scheduledDate;

  const created = await db.tripStopActivity.create({
    data: {
      stopId,
      activityId,
      scheduledDate: safeScheduledDate,
      sortOrder: nextSortOrder,
      estimatedCost: computedCostUsd > 0 ? computedCostUsd : null,
    },
    select: { id: true, scheduledDate: true, estimatedCost: true },
  });

  revalidatePath(`/trips/${stop.tripId}/itinerary`);
  revalidatePath(`/trips/${stop.tripId}/stops/${stopId}/activities`);
  revalidatePath(`/trips/${stop.tripId}`);

  return {
    success: true,
    estimatedCostUsd: computedCostUsd,
    assignment: {
      id: created.id,
      name,
      type: mappedType,
      scheduledDate: created.scheduledDate ? created.scheduledDate.toISOString() : null,
      estimatedCost: created.estimatedCost != null ? Number(created.estimatedCost) : null,
      googlePlaceId,
    },
  };
}

// ─── Step 3: reschedule a planned activity to a different day ────────────────

export type UpdateStopActivityDateState = {
  error?: string;
  success?: boolean;
  scheduledDate?: string;
};

export async function updateStopActivityDate(
  _prev: UpdateStopActivityDateState,
  formData: FormData
): Promise<UpdateStopActivityDateState> {
  const session = await requireSession();

  const stopActivityId = (formData.get("stopActivityId") as string)?.trim();
  const scheduledDateRaw = (formData.get("scheduledDate") as string)?.trim();

  if (!stopActivityId) return { error: "Invalid activity." };
  if (!scheduledDateRaw) return { error: "Pick a day." };

  const scheduledDate = new Date(scheduledDateRaw);
  if (Number.isNaN(scheduledDate.getTime())) return { error: "Invalid date." };

  const assignment = await db.tripStopActivity.findFirst({
    where: {
      id: stopActivityId,
      stop: {
        trip: {
          members: {
            some: {
              userId: session.userId,
              role: { in: ["OWNER", "EDITOR"] },
            },
          },
        },
      },
    },
    select: {
      id: true,
      stopId: true,
      stop: {
        select: {
          tripId: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!assignment) return { error: "Activity not found or access denied." };

  // Compare on UTC day boundaries so timezones don't push a valid date out of
  // range. The stop range is inclusive on both ends.
  const dayStartMs = Date.UTC(
    scheduledDate.getUTCFullYear(),
    scheduledDate.getUTCMonth(),
    scheduledDate.getUTCDate()
  );
  const stopStart = assignment.stop.startDate;
  const stopEnd = assignment.stop.endDate;
  const stopStartMs = Date.UTC(
    stopStart.getUTCFullYear(),
    stopStart.getUTCMonth(),
    stopStart.getUTCDate()
  );
  const stopEndMs = Date.UTC(
    stopEnd.getUTCFullYear(),
    stopEnd.getUTCMonth(),
    stopEnd.getUTCDate()
  );

  if (dayStartMs < stopStartMs || dayStartMs > stopEndMs) {
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      error: `Pick a day inside the stop's dates: ${fmt(stopStart)} – ${fmt(stopEnd)}.`,
    };
  }

  const updated = await db.tripStopActivity.update({
    where: { id: assignment.id },
    data: { scheduledDate },
    select: { scheduledDate: true },
  });

  revalidatePath(`/trips/${assignment.stop.tripId}/itinerary`);
  revalidatePath(`/trips/${assignment.stop.tripId}/stops/${assignment.stopId}/activities`);
  revalidatePath(`/trips/${assignment.stop.tripId}`);

  return {
    success: true,
    scheduledDate: updated.scheduledDate
      ? updated.scheduledDate.toISOString()
      : undefined,
  };
}

// ─── Step 3: remove a planned activity ───────────────────────────────────────

export type RemoveStopActivityState = {
  error?: string;
  success?: boolean;
};

export async function removeStopActivity(
  _prev: RemoveStopActivityState,
  formData: FormData
): Promise<RemoveStopActivityState> {
  const session = await requireSession();

  const stopActivityId = (formData.get("stopActivityId") as string)?.trim();
  if (!stopActivityId) return { error: "Invalid activity." };

  const assignment = await db.tripStopActivity.findFirst({
    where: {
      id: stopActivityId,
      stop: {
        trip: {
          members: {
            some: {
              userId: session.userId,
              role: { in: ["OWNER", "EDITOR"] },
            },
          },
        },
      },
    },
    select: {
      id: true,
      stopId: true,
      stop: { select: { tripId: true } },
    },
  });

  if (!assignment) return { error: "Activity not found or access denied." };

  await db.tripStopActivity.delete({ where: { id: assignment.id } });

  revalidatePath(`/trips/${assignment.stop.tripId}/itinerary`);
  revalidatePath(`/trips/${assignment.stop.tripId}/stops/${assignment.stopId}/activities`);
  revalidatePath(`/trips/${assignment.stop.tripId}`);

  return { success: true };
}
