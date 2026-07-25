// path/to/src/lib/auth/require-auth.ts
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySession, type UserSession } from "./auth-cookie";
import { env } from "@/lib/env";

export async function requireAuth(): Promise<UserSession> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  const session = await verifySession(cookie?.value, env.AUTH_SECRET);

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
