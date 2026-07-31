import { db } from "@/lib/db";
import crypto from "crypto";

const SAFE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateClassroomCode(): string {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    const index = bytes[i] % SAFE_CHARSET.length;
    code += SAFE_CHARSET[index];
  }
  return code;
}

export async function generateUniqueClassroomCode(): Promise<string> {
  const MAX_RETRIES = 5;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateClassroomCode();
    const existing = await db.classroom.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error("Unable to generate unique classroom code after multiple retries.");
}
