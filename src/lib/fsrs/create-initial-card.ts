// src/lib/fsrs/create-initial-card.ts
import { createEmptyCard } from "ts-fsrs";
import { cardToFlashcardData, DbFlashcardFields } from "../fsrs-mapping";

export function createInitialCardData(now: Date = new Date()): DbFlashcardFields {
  const emptyCard = createEmptyCard(now);
  return cardToFlashcardData(emptyCard);
}
