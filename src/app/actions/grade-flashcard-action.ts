// src/app/actions/grade-flashcard-action.ts
"use server";

import { db } from "@/lib/db";
import { Grade, Rating } from "ts-fsrs";
import { gradeFlashcard } from "@/lib/fsrs/grade-flashcard";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";

export type GradeActionResult =
  | { success: true; nextDue: Date }
  | { success: false; notFound?: boolean; error: string };

export async function gradeFlashcardAction(
  flashcardId: string,
  gradeNumber: number
): Promise<GradeActionResult> {
  const session = await requireAuth();

  if (!flashcardId) {
    return { success: false, error: "Flashcard ID is required." };
  }

  // Validate grade is valid user grade (1: Again, 2: Hard, 3: Good, 4: Easy)
  if (
    gradeNumber !== Rating.Again &&
    gradeNumber !== Rating.Hard &&
    gradeNumber !== Rating.Good &&
    gradeNumber !== Rating.Easy
  ) {
    return { success: false, error: "Invalid rating grade." };
  }

  const grade = gradeNumber as Grade;

  try {
    const flashcard = await db.flashcard.findUnique({
      where: { id: flashcardId },
    });

    if (!flashcard || flashcard.userId !== session.userId) {
      return { success: false, notFound: true, error: "Flashcard not found." };
    }

    const now = new Date();
    const { updatedFlashcardData, reviewLogData } = gradeFlashcard(
      flashcard,
      grade,
      now
    );

    const [updated] = await db.$transaction([
      db.flashcard.update({
        where: { id: flashcardId },
        data: updatedFlashcardData,
      }),
      db.reviewLog.create({
        data: {
          flashcardId,
          ...reviewLogData,
        },
      }),
    ]);

    revalidatePath("/review");
    return { success: true, nextDue: updated.due };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to grade flashcard.";
    return { success: false, error: message };
  }
}
