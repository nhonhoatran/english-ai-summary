import {
  TranscriptSegment,
  GrammarPoint,
  QuizQuestion,
  VocabItem,
} from "./lesson-schemas";
import { executeTwoCallStrategy } from "./strategy-two-call";

export type GenerateLessonInput =
  | { kind: "with-captions"; youtubeUrl: string; transcript: TranscriptSegment[] }
  | { kind: "video-only"; youtubeUrl: string };

export interface GeneratedLesson {
  transcript: TranscriptSegment[];
  title: string;
  description: string;
  grammarTheme: string;
  grammarPoints: GrammarPoint[];
  quizQuestions: QuizQuestion[];
  vocabItems: VocabItem[];
}

/**
 * Probe Date: 2026-07-25
 * Single-call video input + JSON schema interaction test resulted in 400 API_KEY_INVALID / unsupported.
 * Set to false so strategy-two-call is the active strategy.
 */
export const GEMINI_SUPPORTS_VIDEO_WITH_SCHEMA = false;

export async function generateLesson(
  input: GenerateLessonInput
): Promise<GeneratedLesson> {
  let attempts = 0;
  const maxAttempts = 2; // 1 initial attempt + 1 retry

  while (attempts < maxAttempts) {
    attempts++;
    try {
      // Dispatch strategy
      const result = await executeTwoCallStrategy(input);

      return {
        transcript: result.transcript,
        title: result.analysis.title,
        description: result.analysis.description,
        grammarTheme: result.analysis.grammarTheme,
        grammarPoints: result.analysis.grammarPoints,
        quizQuestions: result.analysis.quizQuestions,
        vocabItems: result.analysis.vocabItems,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Lesson generation attempt ${attempts} failed:`, errorMessage);

      if (attempts >= maxAttempts) {
        throw new Error(
          `Failed to generate lesson after ${maxAttempts} attempts: ${
            errorMessage || "Validation or API error"
          }`
        );
      }
    }
  }

  throw new Error("Unexpected end of lesson generation retry loop");
}
