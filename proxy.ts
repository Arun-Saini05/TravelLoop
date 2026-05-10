import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/jwt";

const SESSION_COOKIE_NAME = "traveloop_session";

type ProxySessionClaims = {
  sub: string;
  email: string;
  username: string;
  role: string;
};

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt<ProxySessionClaims>(token) : null;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/trips");

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/trips/:path*"],
};
