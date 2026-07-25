// path/to/src/lib/auth/verify-password.ts
import crypto from "node:crypto";
import { env } from "@/lib/env";

export function verifyPassword(password: string): boolean {
  if (typeof password !== "string" || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(env.APP_PASSWORD);

  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
