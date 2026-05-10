"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type NoteActionState = {
  error?: string;
  success?: boolean;
};

async function authorizeMember(tripId: string, userId: string) {
  return db.trip.findFirst({
    where: {
      id: tripId,
      members: { some: { userId } },
    },
    select: { id: true },
  });
}

export async function addTripNote(
  _prev: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const session = await requireSession();
  const tripId = (formData.get("tripId") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;
  const content = (formData.get("content") as string)?.trim();
  const stopIdRaw = (formData.get("stopId") as string)?.trim();
  const noteDateRaw = (formData.get("noteDate") as string)?.trim();

  if (!tripId) return { error: "Invalid trip." };
  if (!content) return { error: "Note content is required." };

  const trip = await authorizeMember(tripId, session.userId);
  if (!trip) return { error: "Access denied." };

  const stopId = stopIdRaw && stopIdRaw !== "trip" ? stopIdRaw : null;
  if (stopId) {
    const stop = await db.tripStop.findFirst({
      where: { id: stopId, tripId },
      select: { id: true },
    });
    if (!stop) return { error: "Selected stop not found." };
  }

  let noteDate: Date | null = null;
  if (noteDateRaw) {
    const parsed = new Date(noteDateRaw);
    if (!Number.isNaN(parsed.getTime())) noteDate = parsed;
  }

  await db.tripNote.create({
    data: {
      tripId,
      stopId,
      authorId: session.userId,
      title,
      content,
      noteDate,
    },
  });

  revalidatePath(`/trips/${tripId}/notes`);
  return { success: true };
}

export async function deleteTripNote(
  _prev: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const session = await requireSession();
  const noteId = (formData.get("noteId") as string)?.trim();
  if (!noteId) return { error: "Invalid note." };

  const note = await db.tripNote.findFirst({
    where: {
      id: noteId,
      OR: [
        { authorId: session.userId },
        {
          trip: {
            members: { some: { userId: session.userId, role: "OWNER" } },
          },
        },
      ],
    },
    select: { id: true, tripId: true },
  });
  if (!note) return { error: "Note not found or access denied." };

  await db.tripNote.delete({ where: { id: note.id } });
  revalidatePath(`/trips/${note.tripId}/notes`);
  return { success: true };
}
