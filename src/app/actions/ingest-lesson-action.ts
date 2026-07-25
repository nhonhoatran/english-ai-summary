// path/to/src/app/actions/ingest-lesson-action.ts
"use server";

import { revalidatePath } from "next/cache";
import { ingestLesson } from "@/lib/ingest/ingest-lesson";
import { requireAuth } from "@/lib/auth/require-auth";

export type IngestActionResult =
  | { success: true; lessonId: string; reused: boolean }
  | { success: false; error: string };

export async function ingestLessonAction(
  url: string
): Promise<IngestActionResult> {
  const session = await requireAuth();

  if (!url || typeof url !== "string") {
    return { success: false, error: "Please enter a YouTube video URL." };
  }

  const result = await ingestLesson(url, session.userId);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePath("/");

  return {
    success: true,
    lessonId: result.lessonId,
    reused: result.reused,
  };
}
