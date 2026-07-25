// path/to/src/lib/ingest/fetch-youtube-captions.ts

import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import { TranscriptSegment } from "../gemini/lesson-schemas";

export async function fetchYoutubeCaptions(
  videoId: string
): Promise<TranscriptSegment[] | null> {
  try {
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!rawTranscript || rawTranscript.length === 0) {
      console.log(
        `[fetchYoutubeCaptions] No caption segments returned for videoId=${videoId}`
      );
      return null;
    }

    // Empirically verified: @danielxceron/youtube-transcript returns offset in SECONDS
    const segments: TranscriptSegment[] = rawTranscript.map((item) => ({
      startSeconds: Math.floor(item.offset),
      speaker: "Unknown",
      text: item.text.trim(),
    }));

    console.log(
      `[fetchYoutubeCaptions] Successfully fetched ${segments.length} caption segments for videoId=${videoId}`
    );

    return segments;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[fetchYoutubeCaptions] Captions unavailable for videoId=${videoId}: ${message}. Falling back to Gemini.`
    );
    return null;
  }
}
