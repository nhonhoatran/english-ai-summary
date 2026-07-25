// src/lib/fsrs/grade-flashcard.ts
import { Grade } from "ts-fsrs";
import { scheduler } from "./fsrs-instance";
import {
  DbFlashcardFields,
  DbReviewLogFields,
  flashcardToCard,
  cardToFlashcardData,
  reviewLogToPrismaData,
} from "../fsrs-mapping";

export interface GradeResult {
  updatedFlashcardData: DbFlashcardFields;
  reviewLogData: DbReviewLogFields;
}

export function gradeFlashcard(
  row: DbFlashcardFields,
  grade: Grade,
  now: Date = new Date()
): GradeResult {
  const card = flashcardToCard(row);
  const recordLogItem = scheduler.next(card, now, grade);

  return {
    updatedFlashcardData: cardToFlashcardData(recordLogItem.card),
    reviewLogData: reviewLogToPrismaData(recordLogItem.log),
  };
}
