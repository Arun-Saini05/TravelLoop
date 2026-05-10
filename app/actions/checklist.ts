"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type ChecklistActionState = {
  error?: string;
  success?: boolean;
};

async function authorizeEditor(tripId: string, userId: string) {
  return db.trip.findFirst({
    where: {
      id: tripId,
      members: {
        some: {
          userId,
          role: { in: ["OWNER", "EDITOR"] },
        },
      },
    },
    select: { id: true },
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function addChecklistCategory(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();

  if (!tripId) return { error: "Invalid trip." };
  if (!name) return { error: "Category name is required." };

  const trip = await authorizeEditor(tripId, session.userId);
  if (!trip) return { error: "Access denied." };

  const last = await db.checklistCategory.findFirst({
    where: { tripId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextOrder = (last?.sortOrder ?? -1) + 1;

  try {
    await db.checklistCategory.create({
      data: { tripId, name, sortOrder: nextOrder },
    });
  } catch {
    return { error: `A category named "${name}" already exists.` };
  }

  revalidatePath(`/trips/${tripId}/checklist`);
  return { success: true };
}

export async function deleteChecklistCategory(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const categoryId = (formData.get("categoryId") as string)?.trim();
  if (!categoryId) return { error: "Invalid category." };

  const cat = await db.checklistCategory.findFirst({
    where: {
      id: categoryId,
      trip: {
        members: {
          some: { userId: session.userId, role: { in: ["OWNER", "EDITOR"] } },
        },
      },
    },
    select: { id: true, tripId: true },
  });
  if (!cat) return { error: "Category not found." };

  await db.checklistCategory.delete({ where: { id: cat.id } });
  revalidatePath(`/trips/${cat.tripId}/checklist`);
  return { success: true };
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function addChecklistItem(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();
  const categoryIdRaw = (formData.get("categoryId") as string)?.trim();

  if (!tripId) return { error: "Invalid trip." };
  if (!label) return { error: "Item label is required." };

  const trip = await authorizeEditor(tripId, session.userId);
  if (!trip) return { error: "Access denied." };

  const categoryId = categoryIdRaw && categoryIdRaw !== "none" ? categoryIdRaw : null;
  if (categoryId) {
    const cat = await db.checklistCategory.findFirst({
      where: { id: categoryId, tripId },
      select: { id: true },
    });
    if (!cat) return { error: "Selected category not found." };
  }

  const last = await db.checklistItem.findFirst({
    where: { tripId, categoryId: categoryId ?? null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextOrder = (last?.sortOrder ?? -1) + 1;

  await db.checklistItem.create({
    data: {
      tripId,
      categoryId,
      addedById: session.userId,
      label,
      sortOrder: nextOrder,
    },
  });

  revalidatePath(`/trips/${tripId}/checklist`);
  return { success: true };
}

export async function toggleChecklistItem(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const itemId = (formData.get("itemId") as string)?.trim();
  const isPackedRaw = (formData.get("isPacked") as string)?.trim();
  if (!itemId) return { error: "Invalid item." };

  const isPacked = isPackedRaw === "true";

  const item = await db.checklistItem.findFirst({
    where: {
      id: itemId,
      trip: {
        members: {
          some: { userId: session.userId, role: { in: ["OWNER", "EDITOR"] } },
        },
      },
    },
    select: { id: true, tripId: true },
  });
  if (!item) return { error: "Item not found." };

  await db.checklistItem.update({
    where: { id: item.id },
    data: {
      isPacked,
      packedAt: isPacked ? new Date() : null,
    },
  });

  revalidatePath(`/trips/${item.tripId}/checklist`);
  return { success: true };
}

export async function deleteChecklistItem(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const itemId = (formData.get("itemId") as string)?.trim();
  if (!itemId) return { error: "Invalid item." };

  const item = await db.checklistItem.findFirst({
    where: {
      id: itemId,
      trip: {
        members: {
          some: { userId: session.userId, role: { in: ["OWNER", "EDITOR"] } },
        },
      },
    },
    select: { id: true, tripId: true },
  });
  if (!item) return { error: "Item not found." };

  await db.checklistItem.delete({ where: { id: item.id } });
  revalidatePath(`/trips/${item.tripId}/checklist`);
  return { success: true };
}

export async function resetChecklist(
  _prev: ChecklistActionState,
  formData: FormData
): Promise<ChecklistActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  if (!tripId) return { error: "Invalid trip." };

  const trip = await authorizeEditor(tripId, session.userId);
  if (!trip) return { error: "Access denied." };

  await db.checklistItem.updateMany({
    where: { tripId },
    data: { isPacked: false, packedAt: null },
  });

  revalidatePath(`/trips/${tripId}/checklist`);
  return { success: true };
}
