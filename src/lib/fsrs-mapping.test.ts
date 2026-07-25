import { describe, it, expect } from "vitest";
import { State, Rating, createEmptyCard } from "ts-fsrs";
import { FsrsState, FsrsRating } from "@prisma/client";
import {
  toPrismaState,
  toFsrsState,
  toPrismaRating,
  toFsrsRating,
  cardToFlashcardData,
  flashcardToCard,
  reviewLogToPrismaData,
  DbFlashcardFields,
} from "./fsrs-mapping";

describe("fsrs-mapping", () => {
  describe("enum mappings", () => {
    it("maps State to FsrsState and back correctly", () => {
      expect(toPrismaState(State.New)).toBe(FsrsState.New);
      expect(toPrismaState(State.Learning)).toBe(FsrsState.Learning);
      expect(toPrismaState(State.Review)).toBe(FsrsState.Review);
      expect(toPrismaState(State.Relearning)).toBe(FsrsState.Relearning);

      expect(toFsrsState(FsrsState.New)).toBe(State.New);
      expect(toFsrsState(FsrsState.Learning)).toBe(State.Learning);
      expect(toFsrsState(FsrsState.Review)).toBe(State.Review);
      expect(toFsrsState(FsrsState.Relearning)).toBe(State.Relearning);
    });

    it("maps Rating to FsrsRating and back correctly", () => {
      expect(toPrismaRating(Rating.Manual)).toBe(FsrsRating.Manual);
      expect(toPrismaRating(Rating.Again)).toBe(FsrsRating.Again);
      expect(toPrismaRating(Rating.Hard)).toBe(FsrsRating.Hard);
      expect(toPrismaRating(Rating.Good)).toBe(FsrsRating.Good);
      expect(toPrismaRating(Rating.Easy)).toBe(FsrsRating.Easy);

      expect(toFsrsRating(FsrsRating.Manual)).toBe(Rating.Manual);
      expect(toFsrsRating(FsrsRating.Again)).toBe(Rating.Again);
      expect(toFsrsRating(FsrsRating.Hard)).toBe(Rating.Hard);
      expect(toFsrsRating(FsrsRating.Good)).toBe(Rating.Good);
      expect(toFsrsRating(FsrsRating.Easy)).toBe(Rating.Easy);
    });
  });

  describe("cardToFlashcardData & flashcardToCard", () => {
    it("converts Card to DbFlashcardFields with no undefined fields", () => {
      const now = new Date("2026-07-25T10:00:00Z");
      const emptyCard = createEmptyCard(now);
      const converted = cardToFlashcardData(emptyCard);

      for (const [key, value] of Object.entries(converted)) {
        expect(value, `Field ${key} should not be undefined`).not.toBeUndefined();
      }
    });

    it("round-trips DbFlashcardFields through Card without loss", () => {
      const row: DbFlashcardFields = {
        due: new Date("2026-07-26T10:00:00Z"),
        stability: 2.5,
        difficulty: 4.8,
        elapsedDays: 1,
        scheduledDays: 1,
        learningSteps: 0,
        reps: 3,
        lapses: 0,
        state: FsrsState.Review,
        lastReview: new Date("2026-07-25T10:00:00Z"),
      };

      const card = flashcardToCard(row);
      const restored = cardToFlashcardData(card);

      expect(restored).toEqual(row);
    });

    it("handles null lastReview <-> undefined last_review mapping", () => {
      const rowNoReview: DbFlashcardFields = {
        due: new Date("2026-07-25T10:00:00Z"),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 0,
        lapses: 0,
        state: FsrsState.New,
        lastReview: null,
      };

      const card = flashcardToCard(rowNoReview);
      expect(card.last_review).toBeUndefined();

      const restored = cardToFlashcardData(card);
      expect(restored.lastReview).toBeNull();
    });
  });

  describe("reviewLogToPrismaData", () => {
    it("converts ts-fsrs ReviewLog to DbReviewLogFields with correct snake to camel mapping", () => {
      const now = new Date("2026-07-25T10:00:00Z");
      const due = new Date("2026-07-26T10:00:00Z");

      const log = {
        rating: Rating.Good,
        state: State.Learning,
        due: due,
        stability: 1.5,
        difficulty: 5.0,
        elapsed_days: 0,
        last_elapsed_days: 0,
        scheduled_days: 1,
        learning_steps: 1,
        review: now,
      };

      const prismaData = reviewLogToPrismaData(log);

      expect(prismaData.rating).toBe(FsrsRating.Good);
      expect(prismaData.state).toBe(FsrsState.Learning);
      expect(prismaData.due).toEqual(due);
      expect(prismaData.stability).toBe(1.5);
      expect(prismaData.difficulty).toBe(5.0);
      expect(prismaData.elapsedDays).toBe(0);
      expect(prismaData.lastElapsedDays).toBe(0);
      expect(prismaData.scheduledDays).toBe(1);
      expect(prismaData.learningSteps).toBe(1);
      expect(prismaData.reviewedAt).toEqual(now);
    });
  });
});
