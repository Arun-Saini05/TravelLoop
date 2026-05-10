"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSession, createSession } from "@/lib/session";

export type AuthActionState = {
  error?: string;
};

function getRequiredField(formData: FormData, field: string): string {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const firstName = getRequiredField(formData, "firstName");
  const lastName = getRequiredField(formData, "lastName");
  const email = getRequiredField(formData, "email").toLowerCase();
  const username = getRequiredField(formData, "username").toLowerCase();
  const password = getRequiredField(formData, "password");

  if (!firstName || !email || !username || !password) {
    return { error: "Please fill all required fields." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (!isValidPassword(password)) {
    return { error: "Password must be at least 8 characters long." };
  }

  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: {
      email: true,
      username: true,
    },
  });

  if (existingUser?.email === email) {
    return { error: "An account with this email already exists." };
  }

  if (existingUser?.username === username) {
    return { error: "This username is already taken." };
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      firstName,
      lastName: lastName || null,
      email,
      username,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  redirect("/dashboard");
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = getRequiredField(formData, "email").toLowerCase();
  const password = getRequiredField(formData, "password");

  if (!email || !password) {
    return { error: "Please provide email and password." };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user?.isActive) {
    return { error: "Invalid credentials." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return { error: "Invalid credentials." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
