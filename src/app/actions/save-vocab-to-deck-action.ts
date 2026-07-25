// path/to/src/app/actions/save-vocab-to-deck-action.ts
"use server";

import { db } from "@/lib/db";
import { createInitialCardData } from "@/lib/fsrs/create-initial-card";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";

export type SaveVocabResult =
  | { success: true; flashcardId: string }
  | { success: false; error: string };

export async function saveVocabToDeckAction(
  vocabItemId: string
): Promise<SaveVocabResult> {
  const session = await requireAuth();

  if (!vocabItemId) {
    return { success: false, error: "Vocabulary item ID is required." };
  }

  try {
    const vocabItem = await db.vocabItem.findUnique({
      where: { id: vocabItemId },
      select: { id: true, lessonId: true },
    });

    if (!vocabItem) {
      return { success: false, error: "Vocabulary item not found." };
    }

    const existingFlashcard = await db.flashcard.findUnique({
      where: {
        userId_vocabItemId: {
          userId: session.userId,
          vocabItemId,
        },
      },
    });

    if (existingFlashcard) {
      return { success: true, flashcardId: existingFlashcard.id };
    }

    const initialCardData = createInitialCardData();

    const created = await db.flashcard.create({
      data: {
        userId: session.userId,
        vocabItemId,
        ...initialCardData,
      },
    });

    revalidatePath(`/lessons/${vocabItem.lessonId}`);
    return { success: true, flashcardId: created.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save to deck.";
    return { success: false, error: message };
  }
}
