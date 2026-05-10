"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import type { TripVisibility } from "@/app/generated/prisma";

export type ShareActionState = {
  error?: string;
  success?: boolean;
};

const ALLOWED_VISIBILITY: readonly TripVisibility[] = ["PRIVATE", "FRIENDS", "PUBLIC"];

async function authorizeOwner(tripId: string, userId: string) {
  return db.trip.findFirst({
    where: {
      id: tripId,
      members: {
        some: {
          userId,
          role: "OWNER",
        },
      },
    },
    select: { id: true },
  });
}

function generateSlug(): string {
  // 12 chars of base36 from 9 random bytes — short enough for URLs, plenty for
  // a shareable token. We rely on the schema's @unique constraint as the final
  // collision guard.
  return randomBytes(9).toString("base64url").replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();
}

// ─── Visibility ──────────────────────────────────────────────────────────────

export async function updateTripVisibility(
  _prev: ShareActionState,
  formData: FormData
): Promise<ShareActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  const visibilityRaw = (formData.get("visibility") as string)?.trim() as TripVisibility;

  if (!tripId) return { error: "Invalid trip." };
  if (!ALLOWED_VISIBILITY.includes(visibilityRaw)) {
    return { error: "Invalid visibility setting." };
  }

  const trip = await authorizeOwner(tripId, session.userId);
  if (!trip) return { error: "Only the trip owner can change visibility." };

  await db.trip.update({
    where: { id: tripId },
    data: { visibility: visibilityRaw },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/share`);
  return { success: true };
}

// ─── Share links ─────────────────────────────────────────────────────────────

export async function createShareLink(
  _prev: ShareActionState,
  formData: FormData
): Promise<ShareActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  const allowCopy = (formData.get("allowCopy") as string) !== "false";

  if (!tripId) return { error: "Invalid trip." };
  const trip = await authorizeOwner(tripId, session.userId);
  if (!trip) return { error: "Only the trip owner can create share links." };

  // Try a few times in the (vanishingly unlikely) case of slug collision.
  let lastErr: unknown = null;
  for (let i = 0; i < 5; i++) {
    try {
      await db.tripShareLink.create({
        data: {
          tripId,
          createdById: session.userId,
          slug: generateSlug(),
          isPublic: true,
          allowCopy,
        },
      });
      revalidatePath(`/trips/${tripId}/share`);
      return { success: true };
    } catch (e) {
      lastErr = e;
    }
  }
  return {
    error:
      lastErr instanceof Error
        ? lastErr.message
        : "Failed to create share link.",
  };
}

export async function revokeShareLink(
  _prev: ShareActionState,
  formData: FormData
): Promise<ShareActionState> {
  const session = await requireSession();
  const linkId = (formData.get("linkId") as string)?.trim();
  if (!linkId) return { error: "Invalid link." };

  const link = await db.tripShareLink.findFirst({
    where: {
      id: linkId,
      trip: {
        members: {
          some: { userId: session.userId, role: "OWNER" },
        },
      },
    },
    select: { id: true, tripId: true },
  });
  if (!link) return { error: "Share link not found." };

  await db.tripShareLink.delete({ where: { id: link.id } });
  revalidatePath(`/trips/${link.tripId}/share`);
  return { success: true };
}
