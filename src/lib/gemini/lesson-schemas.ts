import { z } from "zod";

export const transcriptSegmentSchema = z.object({
  startSeconds: z.number().int().min(0),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const grammarPointSchema = z.object({
  explanation: z.string().min(1),
  examples: z.array(z.string().min(1)).length(4), // exactly 4 - verified elllo format
});

export const quizQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(3), // exactly 3 - a/b/c
  correctIndex: z.number().int().min(0).max(2),
});

export const vocabItemSchema = z.object({
  term: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().min(1),
});

export const lessonAnalysisSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  grammarTheme: z.string().min(1),
  grammarPoints: z.array(grammarPointSchema).min(1),
  quizQuestions: z.array(quizQuestionSchema).min(1),
  vocabItems: z.array(vocabItemSchema).min(1),
});

export const transcriptSchema = z.array(transcriptSegmentSchema);

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type GrammarPoint = z.infer<typeof grammarPointSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type VocabItem = z.infer<typeof vocabItemSchema>;
export type LessonAnalysis = z.infer<typeof lessonAnalysisSchema>;

/**
 * Clean OpenAPI Schema for Gemini API responseSchema.
 */
export function getLessonAnalysisJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      grammarTheme: { type: "string" },
      grammarPoints: {
        type: "array",
        items: {
          type: "object",
          properties: {
            explanation: { type: "string" },
            examples: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["explanation", "examples"],
        },
      },
      quizQuestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
            },
            correctIndex: { type: "integer" },
          },
          required: ["prompt", "options", "correctIndex"],
        },
      },
      vocabItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            meaning: { type: "string" },
            example: { type: "string" },
          },
          required: ["term", "meaning", "example"],
        },
      },
    },
    required: [
      "title",
      "description",
      "grammarTheme",
      "grammarPoints",
      "quizQuestions",
      "vocabItems",
    ],
  };
}

export function getTranscriptJsonSchema(): Record<string, unknown> {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        startSeconds: { type: "integer" },
        speaker: { type: "string" },
        text: { type: "string" },
      },
      required: ["startSeconds", "speaker", "text"],
    },
  };
}
