import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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
  grammarPoints: z.array(grammarPointSchema).length(4), // exactly 4
  quizQuestions: z.array(quizQuestionSchema).length(5), // exactly 5
  vocabItems: z.array(vocabItemSchema).min(6).max(10),
});

export const transcriptSchema = z.array(transcriptSegmentSchema);

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type GrammarPoint = z.infer<typeof grammarPointSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type VocabItem = z.infer<typeof vocabItemSchema>;
export type LessonAnalysis = z.infer<typeof lessonAnalysisSchema>;

/**
 * Derives clean JSON Schema for Gemini API response_format.
 * Strips $schema and unsupported keywords if present.
 */
export function getLessonAnalysisJsonSchema(): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(lessonAnalysisSchema as unknown as Parameters<typeof zodToJsonSchema>[0], "LessonAnalysis") as Record<string, unknown>;
  const target = (jsonSchema.definitions as Record<string, unknown>)?.LessonAnalysis ?? jsonSchema;
  
  const cleanSchema = JSON.parse(JSON.stringify(target));
  delete cleanSchema.$schema;
  delete cleanSchema.additionalProperties;
  
  return cleanSchema;
}

export function getTranscriptJsonSchema(): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(transcriptSchema as unknown as Parameters<typeof zodToJsonSchema>[0], "Transcript") as Record<string, unknown>;
  const target = (jsonSchema.definitions as Record<string, unknown>)?.Transcript ?? jsonSchema;

  const cleanSchema = JSON.parse(JSON.stringify(target));
  delete cleanSchema.$schema;
  delete cleanSchema.additionalProperties;

  return cleanSchema;
}
