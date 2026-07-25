// path/to/src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE_SECONDS, signSession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    let phone = "";
    let nextParam = "/";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      phone = (body.phone || body.password || "").trim();
      if (body.next) nextParam = body.next;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      phone = ((formData.get("phone") || formData.get("password")) as string || "").trim();
      const n = formData.get("next") as string;
      if (n) nextParam = n;
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập số điện thoại." },
        { status: 400 }
      );
    }

    // Upsert user by phone number
    const user = await db.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });

    // Open-redirect guard
    let redirectUrl = "/";
    if (typeof nextParam === "string" && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
      redirectUrl = nextParam;
    }

    const token = await signSession({ userId: user.id, phone: user.phone }, env.AUTH_SECRET);
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
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { success: false, error: "Đăng nhập thất bại. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
