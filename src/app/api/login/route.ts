// path/to/src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/verify-password";
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE_SECONDS, signSession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    let password = "";
    let nextParam = "/";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      password = body.password || "";
      if (body.next) nextParam = body.next;
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      password = (formData.get("password") as string) || "";
      const n = formData.get("next") as string;
      if (n) nextParam = n;
    }

    // Validate open-redirect guard: must start with single slash '/' and not double slash '//'
    let redirectUrl = "/";
    if (typeof nextParam === "string" && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      redirectUrl = nextParam;
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Invalid password." },
        { status: 401 }
      );
    }

    const token = await signSession(env.AUTH_SECRET);
    const response = NextResponse.json({ success: true, redirectUrl });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
