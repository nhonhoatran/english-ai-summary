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
  input: StrategyInput
): Promise<StrategyResult> {
  let transcript: TranscriptSegment[];

  if (input.kind === "with-captions") {
    transcript = input.transcript;
  } else {
    // Call 1: Transcribe video
    const transcriptionPrompt = buildTranscriptionPrompt();
    const transcriptInteraction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: [
        { type: "text", text: transcriptionPrompt },
        { type: "video", uri: input.youtubeUrl },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: getTranscriptJsonSchema(),
      },
    });

    const rawTranscriptJson = transcriptInteraction.output_text;
    if (!rawTranscriptJson) {
      throw new Error("Gemini returned empty transcription output");
    }

    const parsedTranscript = JSON.parse(rawTranscriptJson);
    transcript = transcriptSchema.parse(parsedTranscript);
  }

  // Call 2: Text-only lesson analysis
  const formattedTranscript = formatTranscriptForPrompt(transcript);
  const analysisPrompt = buildLessonAnalysisPrompt(formattedTranscript);

  const analysisInteraction = await ai.interactions.create({
    model: GEMINI_MODEL,
    input: [{ type: "text", text: analysisPrompt }],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: getLessonAnalysisJsonSchema(),
    },
  });

  const rawAnalysisJson = analysisInteraction.output_text;
  if (!rawAnalysisJson) {
    throw new Error("Gemini returned empty lesson analysis output");
  }

  const parsedAnalysis = JSON.parse(rawAnalysisJson);
  const analysis = lessonAnalysisSchema.parse(parsedAnalysis);

  return { transcript, analysis };
}
