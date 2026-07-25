// path/to/src/app/actions/save-vocab-to-deck-action.ts
"use server";

import { db } from "@/lib/db";
import { createInitialCardData } from "@/lib/fsrs/create-initial-card";
import { revalidatePath } from "next/cache";

export type SaveVocabResult =
  | { success: true; flashcardId: string }
  | { success: false; error: string };

export async function saveVocabToDeckAction(
  vocabItemId: string
): Promise<SaveVocabResult> {
  if (!vocabItemId) {
    return { success: false, error: "Vocabulary item ID is required." };
  }

  try {
    const vocabItem = await db.vocabItem.findUnique({
      where: { id: vocabItemId },
      include: { flashcard: true, lesson: { select: { id: true } } },
    });

    if (!vocabItem) {
      return { success: false, error: "Vocabulary item not found." };
    }

    if (vocabItem.flashcard) {
      return { success: true, flashcardId: vocabItem.flashcard.id };
    }

    const initialCardData = createInitialCardData();

    const created = await db.flashcard.create({
      data: {
        vocabItemId,
        ...initialCardData,
      },
    });

    revalidatePath(`/lessons/${vocabItem.lesson.id}`);
    return { success: true, flashcardId: created.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save to deck.";
    return { success: false, error: message };
  }
}
