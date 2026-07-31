"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";

export async function getWritingPromptAnswer(promptId: string): Promise<string | null> {
  const session = await requireAuth();
  const prompt = await db.writingPrompt.findFirst({
    where: { id: promptId, lesson: { userId: session.userId } },
    select: { enAnswer: true },
  });
  return prompt?.enAnswer ?? null;
}
