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

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createTrip(
  _previousState: CreateTripActionState,
  formData: FormData
): Promise<CreateTripActionState> {
  const session = await requireSession();

  const tripName = getRequiredString(formData, "tripName");
  const startDateRaw = getRequiredString(formData, "startDate");
  const endDateRaw = getRequiredString(formData, "endDate");

  if (!tripName) {
    return { error: "Trip name is required." };
  }

  const startDate = parseDate(startDateRaw);
  const endDate = parseDate(endDateRaw);

  if (!startDate || !endDate) {
    return { error: "Please provide valid start and end dates." };
  }

  // Reject past start dates (compare against the start of "today" so a same-day
  // trip is still allowed).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (startDate < todayStart) {
    return { error: "Start date cannot be in the past." };
  }

  if (endDate < startDate) {
    return { error: "End date cannot be earlier than start date." };
  }

  const trip = await db.$transaction(async (tx) => {
    const createdTrip = await tx.trip.create({
      data: {
        ownerId: session.userId,
        name: tripName,
        startDate,
        endDate,
        status: "DRAFT",
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

    return createdTrip;
  });

  revalidatePath("/dashboard");
  redirect(`/trips/${trip.id}/itinerary`);
}
