import { getSubtitles } from "youtube-caption-extractor";
import { TranscriptSegment } from "../gemini/lesson-schemas";

export async function fetchYoutubeCaptions(
  videoId: string,
  lang?: string
): Promise<TranscriptSegment[] | null> {
  try {
    const primaryLang = lang ?? "en";
    let subtitles = await getSubtitles({ videoID: videoId, lang: primaryLang }).catch(() => null);

    if ((!subtitles || subtitles.length === 0) && primaryLang === "zh-Hans") {
      subtitles = await getSubtitles({ videoID: videoId, lang: "zh-Hant" }).catch(() => null);
    }

    if (!subtitles || subtitles.length === 0) {
      subtitles = await getSubtitles({ videoID: videoId }).catch(() => null);
    }

    if (!subtitles || subtitles.length === 0) {
      console.log(
        `[fetchYoutubeCaptions] No caption segments returned for videoId=${videoId} (lang=${primaryLang})`
      );
      return null;
    }

    const segments: TranscriptSegment[] = subtitles.map((item) => ({
      startSeconds: Math.floor(parseFloat(item.start)),
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
