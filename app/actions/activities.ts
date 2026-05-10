"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
