/**
 * Single-Call Strategy (UNWIRED / FALLBACK ONLY)
 * Probe Date: 2026-07-25
 * Probe Status: Disabled / Not confirmed supported on API key tier.
 * 
 * If single-call video input + response_format (schema) is verified working on a valid key,
 * this strategy can perform video transcription + elllo analysis in a single request.
 */

import { ai, GEMINI_MODEL } from "./client";
import {
  lessonAnalysisSchema,
  getLessonAnalysisJsonSchema,
  LessonAnalysis,
  TranscriptSegment,
} from "./lesson-schemas";
import { buildLessonAnalysisPrompt } from "./prompt-lesson-analysis";

export async function executeSingleCallStrategy(_youtubeUrl: string): Promise<{
  transcript: TranscriptSegment[];
  analysis: LessonAnalysis;
}> {
  const prompt = buildLessonAnalysisPrompt("Analyze spoken audio directly from video.");
  
  const interaction = await ai.interactions.create({
    model: GEMINI_MODEL,
    input: [
      { type: "text", text: prompt },
      { type: "video", uri: _youtubeUrl },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: getLessonAnalysisJsonSchema(),
    },
  });

  const rawJson = interaction.output_text;
  if (!rawJson) {
    throw new Error("Gemini returned empty single-call output");
  }

  const parsed = JSON.parse(rawJson);
  const analysis = lessonAnalysisSchema.parse(parsed);

  // Note: single call strategy would also need transcript returned in the schema
  return { transcript: [], analysis };
}
