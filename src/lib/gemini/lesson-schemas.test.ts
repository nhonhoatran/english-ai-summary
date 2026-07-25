import { describe, it, expect } from "vitest";
import { lessonAnalysisSchema } from "./lesson-schemas";
import { validGeneratedLessonFixture } from "@/../tests/fixtures/generated-lesson-fixture";

describe("lessonAnalysisSchema Zod Arity and Field Validation", () => {
  const baseLessonAnalysis = {
    title: validGeneratedLessonFixture.title,
    description: validGeneratedLessonFixture.description,
    grammarTheme: validGeneratedLessonFixture.grammarTheme,
    grammarPoints: validGeneratedLessonFixture.grammarPoints,
    quizQuestions: validGeneratedLessonFixture.quizQuestions,
    vocabItems: validGeneratedLessonFixture.vocabItems,
  };

  it("parses valid fixture successfully", () => {
    const result = lessonAnalysisSchema.safeParse(baseLessonAnalysis);
    expect(result.success).toBe(true);
  });

  it("rejects 3 grammar points (requires exactly 4)", () => {
    const invalid = {
      ...baseLessonAnalysis,
      grammarPoints: baseLessonAnalysis.grammarPoints.slice(0, 3),
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 5 examples in a grammar point (requires exactly 4)", () => {
    const invalidGp = [
      {
        ...baseLessonAnalysis.grammarPoints[0],
        examples: [...baseLessonAnalysis.grammarPoints[0].examples, "Extra example 5"],
      },
      ...baseLessonAnalysis.grammarPoints.slice(1),
    ];
    const invalid = {
      ...baseLessonAnalysis,
      grammarPoints: invalidGp,
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 4 quiz questions (requires exactly 5)", () => {
    const invalid = {
      ...baseLessonAnalysis,
      quizQuestions: baseLessonAnalysis.quizQuestions.slice(0, 4),
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 2 options in a quiz question (requires exactly 3)", () => {
    const invalidQq = [
      {
        ...baseLessonAnalysis.quizQuestions[0],
        options: ["Option A", "Option B"],
      },
      ...baseLessonAnalysis.quizQuestions.slice(1),
    ];
    const invalid = {
      ...baseLessonAnalysis,
      quizQuestions: invalidQq,
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects correctIndex out of range (correctIndex = 3)", () => {
    const invalidQq = [
      {
        ...baseLessonAnalysis.quizQuestions[0],
        correctIndex: 3,
      },
      ...baseLessonAnalysis.quizQuestions.slice(1),
    ];
    const invalid = {
      ...baseLessonAnalysis,
      quizQuestions: invalidQq,
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 5 vocab items (requires min 6)", () => {
    const invalid = {
      ...baseLessonAnalysis,
      vocabItems: baseLessonAnalysis.vocabItems.slice(0, 5),
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 11 vocab items (requires max 10)", () => {
    const elevenVocab = [
      ...baseLessonAnalysis.vocabItems,
      ...baseLessonAnalysis.vocabItems.slice(0, 5),
    ];
    const invalid = {
      ...baseLessonAnalysis,
      vocabItems: elevenVocab,
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty string in required text fields", () => {
    const invalid = {
      ...baseLessonAnalysis,
      title: "",
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
