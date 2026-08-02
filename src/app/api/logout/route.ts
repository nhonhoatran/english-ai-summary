// path/to/src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import { isMemberCookieName } from "@/lib/classroom/member-cookie";

export async function POST(request: Request) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl, 303);

  const expire = (name: string) =>
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

  expire(AUTH_COOKIE_NAME);

  // Classroom cookies live for 30 days on path "/", so leaving them behind let
  // the next account signing in from this browser inherit the previous
  // person's classroom identity.
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (isMemberCookieName(cookie.name)) expire(cookie.name);
  }

  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
