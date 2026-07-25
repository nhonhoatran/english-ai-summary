import { ai, GEMINI_MODEL } from "./client";
import {
  lessonAnalysisSchema,
  transcriptSchema,
  getLessonAnalysisJsonSchema,
  getTranscriptJsonSchema,
  LessonAnalysis,
  TranscriptSegment,
} from "./lesson-schemas";
import { buildTranscriptionPrompt } from "./prompt-transcription";
import {
  buildLessonAnalysisPrompt,
  formatTranscriptForPrompt,
  LessonAnalysisOptions,
} from "./prompt-lesson-analysis";

export type StrategyInput =
  | { kind: "with-captions"; youtubeUrl: string; transcript: TranscriptSegment[] }
  | { kind: "video-only"; youtubeUrl: string };

export interface StrategyResult {
  transcript: TranscriptSegment[];
  analysis: LessonAnalysis;
}

/**
 * Strategy Two-Call:
 * - If video-only: Call 1 transcribes video -> JSON transcript segments.
 *   Call 2 performs elllo lesson analysis from the transcript text.
 * - If with-captions: Uses supplied transcript, performs Call 2 text-only analysis.
 */
export async function executeTwoCallStrategy(
  input: StrategyInput,
  options?: LessonAnalysisOptions
): Promise<StrategyResult> {
  let transcript: TranscriptSegment[];

  if (input.kind === "with-captions") {
    transcript = input.transcript;
  } else {
    // Call 1: Transcribe video
    const transcriptionPrompt = buildTranscriptionPrompt();
    const transcriptResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: transcriptionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: getTranscriptJsonSchema() as any,
      },
    });

    const rawTranscriptJson = transcriptResponse.text;
    if (!rawTranscriptJson) {
      throw new Error("Gemini returned empty transcription output");
    }

    const parsedTranscript = JSON.parse(rawTranscriptJson);
    transcript = transcriptSchema.parse(parsedTranscript);
  }

  // Call 2: Text-only lesson analysis
  const formattedTranscript = formatTranscriptForPrompt(transcript);
  const analysisPrompt = buildLessonAnalysisPrompt(formattedTranscript, options);

  const analysisResponse = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: analysisPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: getLessonAnalysisJsonSchema() as any,
    },
  });

  const rawAnalysisJson = analysisResponse.text;
  if (!rawAnalysisJson) {
    throw new Error("Gemini returned empty lesson analysis output");
  }

  const parsedAnalysis = JSON.parse(rawAnalysisJson);
  const analysis = lessonAnalysisSchema.parse(parsedAnalysis);

  return { transcript, analysis };
}
