// path/to/src/app/actions/delete-lesson-action.ts
"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { revalidatePath } from "next/cache";

export type DeleteLessonResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteLessonAction(
  lessonId: string
): Promise<DeleteLessonResult> {
  const session = await requireAuth();

  if (!lessonId || typeof lessonId !== "string") {
    return { success: false, error: "Lesson ID is required." };
  }

  try {
    const result = await db.lesson.deleteMany({
      where: {
        id: lessonId,
        userId: session.userId,
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Lesson not found or you don't have permission to delete it.",
      };
    }

    try {
      revalidatePath("/");
      revalidatePath("/review");
    } catch {
      // revalidatePath may throw in unit test environment
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete lesson.";
    console.error("[deleteLessonAction error]:", message);
    return { success: false, error: message };
  }
}
