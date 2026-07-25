import { describe, it, expect } from "vitest";
import { Rating, Grade } from "ts-fsrs";
import { FsrsState, FsrsRating } from "@prisma/client";
import { gradeFlashcard } from "./grade-flashcard";
import { DbFlashcardFields } from "../fsrs-mapping";

describe("gradeFlashcard", () => {
  const fixedNow = new Date("2026-07-25T10:00:00Z");

  const newCardRow: DbFlashcardFields = {
    due: fixedNow,
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

  const reviewCardRow: DbFlashcardFields = {
    due: fixedNow,
    stability: 5.0,
    difficulty: 5.0,
    elapsedDays: 5,
    scheduledDays: 5,
    learningSteps: 0,
    reps: 3,
    lapses: 0,
    state: FsrsState.Review,
    lastReview: new Date("2026-07-20T10:00:00Z"),
  };

  it("produces due timestamps strictly after now for all grades", () => {
    const grades: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

    for (const grade of grades) {
      const result = gradeFlashcard(newCardRow, grade, fixedNow);
      expect(result.updatedFlashcardData.due.getTime()).toBeGreaterThan(fixedNow.getTime());
    }
  });

  it("holds due(Again) < due(Good) < due(Easy) progression canary", () => {
    const againRes = gradeFlashcard(reviewCardRow, Rating.Again, fixedNow);
    const goodRes = gradeFlashcard(reviewCardRow, Rating.Good, fixedNow);
    const easyRes = gradeFlashcard(reviewCardRow, Rating.Easy, fixedNow);

    const againDue = againRes.updatedFlashcardData.due.getTime();
    const goodDue = goodRes.updatedFlashcardData.due.getTime();
    const easyDue = easyRes.updatedFlashcardData.due.getTime();

    expect(againDue).toBeLessThan(goodDue);
    expect(goodDue).toBeLessThan(easyDue);
  });

  it("increments reps count upon grading", () => {
    const result = gradeFlashcard(newCardRow, Rating.Good, fixedNow);
    expect(result.updatedFlashcardData.reps).toBe(1);
  });

  it("transitions Review state to Relearning when rated Again", () => {
    const result = gradeFlashcard(reviewCardRow, Rating.Again, fixedNow);
    expect(result.updatedFlashcardData.state).toBe(FsrsState.Relearning);
    expect(result.updatedFlashcardData.lapses).toBe(1);
  });

  it("returns reviewLogData whose rating matches the input grade", () => {
    const result = gradeFlashcard(newCardRow, Rating.Easy, fixedNow);
    expect(result.reviewLogData.rating).toBe(FsrsRating.Easy);
    expect(result.reviewLogData.reviewedAt).toEqual(fixedNow);
  });
});
