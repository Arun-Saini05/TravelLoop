"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { UserRole } from "@prisma/client";

// Create a new user (admin only)
export async function adminCreateUser(data: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  passwordHash: string; // Since better-auth normally handles passwords, we will store a dummy one if we create it manually, or better yet, we just create the record. Note: In a real app, you'd use the auth service. For MVP crud, we'll write directly to db.
}) {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const user = await db.user.create({
    data: {
      ...data,
      passwordHash: "admin_created_no_password_set", // Provide a default or use auth library
    },
  });

  await db.adminLog.create({
    data: {
      adminId: session.userId,
      action: "CREATE_USER",
      targetType: "USER",
      targetId: user.id,
      reason: "Admin created user",
    },
  });

  revalidatePath("/admin");
  return { success: true, user };
}

export async function adminUpdateUser(id: string, data: {
  role?: UserRole;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}) {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const user = await db.user.update({
    where: { id },
    data,
  });

  await db.adminLog.create({
    data: {
      adminId: session.userId,
      action: "UPDATE_USER",
      targetType: "USER",
      targetId: user.id,
      reason: "Admin updated user details",
    },
  });

  revalidatePath("/admin");
  return { success: true, user };
}

export async function adminDeleteUser(id: string) {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Unauthorized");

  const user = await db.user.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  });

  await db.adminLog.create({
    data: {
      adminId: session.userId,
      action: "BAN_USER",
      targetType: "USER",
      targetId: user.id,
      reason: "Admin soft-deleted user",
    },
  });

  revalidatePath("/admin");
  return { success: true, user };
}
