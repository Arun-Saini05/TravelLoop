import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/app/generated/prisma/client";
import { signJwt, verifyJwt } from "@/lib/jwt";

const SESSION_COOKIE_NAME = "traveloop_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionClaims = {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
};

export type SessionUser = {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
};

function toSessionUser(claims: SessionClaims): SessionUser {
  return {
    userId: claims.sub,
    email: claims.email,
    username: claims.username,
    role: claims.role,
  };
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = signJwt(
    {
      sub: user.userId,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    SESSION_DURATION_SECONDS
  );

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const claims = verifyJwt<SessionClaims>(token);

  if (!claims?.sub || !claims.email || !claims.username || !claims.role) {
    return null;
  }

  return toSessionUser(claims);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
