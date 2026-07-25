// src/lib/fsrs-mapping.ts
import { Card, Rating, ReviewLog as TsFsrsReviewLog, State } from "ts-fsrs";
import { FsrsRating, FsrsState } from "@prisma/client";

// --- Enum Converters ---

const stateToPrismaMap: Record<State, FsrsState> = {
  [State.New]: FsrsState.New,
  [State.Learning]: FsrsState.Learning,
  [State.Review]: FsrsState.Review,
  [State.Relearning]: FsrsState.Relearning,
};

const stateFromPrismaMap: Record<FsrsState, State> = {
  [FsrsState.New]: State.New,
  [FsrsState.Learning]: State.Learning,
  [FsrsState.Review]: State.Review,
  [FsrsState.Relearning]: State.Relearning,
};

const ratingToPrismaMap: Record<Rating, FsrsRating> = {
  [Rating.Manual]: FsrsRating.Manual,
  [Rating.Again]: FsrsRating.Again,
  [Rating.Hard]: FsrsRating.Hard,
  [Rating.Good]: FsrsRating.Good,
  [Rating.Easy]: FsrsRating.Easy,
};

const ratingFromPrismaMap: Record<FsrsRating, Rating> = {
  [FsrsRating.Manual]: Rating.Manual,
  [FsrsRating.Again]: Rating.Again,
  [FsrsRating.Hard]: Rating.Hard,
  [FsrsRating.Good]: Rating.Good,
  [FsrsRating.Easy]: Rating.Easy,
};

export function toPrismaState(state: State): FsrsState {
  return stateToPrismaMap[state];
}

export function toFsrsState(state: FsrsState): State {
  return stateFromPrismaMap[state];
}

export function toPrismaRating(rating: Rating): FsrsRating {
  return ratingToPrismaMap[rating];
}

export function toFsrsRating(rating: FsrsRating): Rating {
  return ratingFromPrismaMap[rating];
}

// --- Domain / DB Record Converters ---

export interface DbFlashcardFields {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: FsrsState;
  lastReview: Date | null;
}

export function cardToFlashcardData(card: Card): DbFlashcardFields {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: toPrismaState(card.state),
    lastReview: card.last_review ?? null,
  };
}

export function flashcardToCard(flashcard: DbFlashcardFields): Card {
  return {
    due: flashcard.due,
    stability: flashcard.stability,
    difficulty: flashcard.difficulty,
    elapsed_days: flashcard.elapsedDays,
    scheduled_days: flashcard.scheduledDays,
    learning_steps: flashcard.learningSteps,
    reps: flashcard.reps,
    lapses: flashcard.lapses,
    state: toFsrsState(flashcard.state),
    last_review: flashcard.lastReview ?? undefined,
  };
}

export interface DbReviewLogFields {
  rating: FsrsRating;
  state: FsrsState;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reviewedAt: Date;
}

export function reviewLogToPrismaData(log: TsFsrsReviewLog): DbReviewLogFields {
  return {
    rating: toPrismaRating(log.rating),
    state: toPrismaState(log.state),
    due: log.due,
    stability: log.stability,
    difficulty: log.difficulty,
    elapsedDays: log.elapsed_days,
    lastElapsedDays: log.last_elapsed_days,
    scheduledDays: log.scheduled_days,
    learningSteps: log.learning_steps,
    reviewedAt: log.review,
  };
}
