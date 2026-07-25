// path/to/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySession } from "@/lib/auth/auth-cookie";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow login page and login API endpoint without authentication
  if (pathname === "/login" || pathname === "/api/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  const secret = process.env.AUTH_SECRET || "";
  const isValid = await verifySession(cookie?.value, secret);

  if (!isValid) {
    const fullPath = pathname + search;
    const loginUrl = new URL("/login", request.url);
    if (fullPath !== "/") {
      loginUrl.searchParams.set("next", fullPath);
    }
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public asset files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
