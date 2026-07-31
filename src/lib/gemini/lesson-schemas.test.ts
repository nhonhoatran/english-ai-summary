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
    dialogueLines: validGeneratedLessonFixture.dialogueLines,
    summary: validGeneratedLessonFixture.summary,
    writingPrompts: validGeneratedLessonFixture.writingPrompts,
  };

  it("parses valid fixture successfully", () => {
    const result = lessonAnalysisSchema.safeParse(baseLessonAnalysis);
    expect(result.success).toBe(true);
  });

  it("accepts custom count of grammar points (e.g. 6 points)", () => {
    const sixPoints = [
      ...baseLessonAnalysis.grammarPoints,
      ...baseLessonAnalysis.grammarPoints.slice(0, 2),
    ];
    const valid = {
      ...baseLessonAnalysis,
      grammarPoints: sixPoints,
    };
    const result = lessonAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts custom count of quiz questions (e.g. 10 questions)", () => {
    const tenQuestions = [
      ...baseLessonAnalysis.quizQuestions,
      ...baseLessonAnalysis.quizQuestions,
    ];
    const valid = {
      ...baseLessonAnalysis,
      quizQuestions: tenQuestions,
    };
    const result = lessonAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts custom count of vocab items (e.g. 15 vocab items)", () => {
    const fifteenVocab = [
      ...baseLessonAnalysis.vocabItems,
      ...baseLessonAnalysis.vocabItems,
      ...baseLessonAnalysis.vocabItems,
    ];
    const valid = {
      ...baseLessonAnalysis,
      vocabItems: fifteenVocab,
    };
    const result = lessonAnalysisSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty grammarPoints array", () => {
    const invalid = {
      ...baseLessonAnalysis,
      grammarPoints: [],
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

  it("rejects empty string in required text fields", () => {
    const invalid = {
      ...baseLessonAnalysis,
      title: "",
    };
    const result = lessonAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
