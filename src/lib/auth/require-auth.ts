// path/to/src/lib/auth/require-auth.ts
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySession } from "./auth-cookie";
import { env } from "@/lib/env";

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  const isValid = await verifySession(cookie?.value, env.AUTH_SECRET);

  if (!isValid) {
    throw new Error("Unauthorized");
  }
}
