"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { firstName: string; lastName: string; email: string }) {
  const session = await requireSession();
  
  await db.user.update({
    where: { id: session.userId },
    data: {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email,
    }
  });

  revalidatePath("/profile");
  return { success: true };
}
