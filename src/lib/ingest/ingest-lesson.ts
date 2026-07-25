// path/to/src/lib/ingest/ingest-lesson.ts

import { db } from "../db";
import { parseYoutubeUrl } from "./parse-youtube-url";
import { fetchYoutubeCaptions } from "./fetch-youtube-captions";
import { generateLesson, GeneratedLesson } from "../gemini/generate-lesson";
import { LessonAnalysisOptions } from "../gemini/prompt-lesson-analysis";

export type IngestResult =
  | { ok: true; lessonId: string; reused: boolean }
  | { ok: false; error: string };

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("private") ||
    lower.includes("unlisted") ||
    lower.includes("permission_denied")
  ) {
    return "This video is private or unlisted, so it can't be processed.";
  }

  if (lower.includes("playlist")) {
    return "Playlists aren't supported — paste a single video link.";
  }

  return "Couldn't generate the lesson. Try again.";
}

/**
 * Main orchestrator for lesson ingestion.
 * Single entry point for fetching, AI generation, and atomic database persistence per user.
 */
export async function ingestLesson(
  rawUrl: string,
  userId: string,
  options?: LessonAnalysisOptions
): Promise<IngestResult> {
  const parseResult = parseYoutubeUrl(rawUrl);
  if (!parseResult.ok) {
    return { ok: false, error: parseResult.error };
  }

  const { videoId } = parseResult;
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Check existing lesson for idempotency for this specific user
  const existing = await db.lesson.findUnique({
    where: {
      userId_videoId: {
        userId,
        videoId,
      },
    },
  });

  if (existing && existing.status === "READY") {
    console.log(`[ingestLesson] Reusing existing lesson for user=${userId} videoId=${videoId}`);
    return { ok: true, lessonId: existing.id, reused: true };
  }

  // 2. Create or reset lesson row in GENERATING status
  let lessonId: string;
  if (existing) {
    lessonId = existing.id;
    await db.lesson.update({
      where: { id: lessonId },
      data: {
        status: "GENERATING",
        errorMessage: null,
      },
    });
  } else {
    const created = await db.lesson.create({
      data: {
        userId,
        videoId,
        videoUrl: canonicalUrl,
        title: "Processing lesson...",
        transcriptSource: "youtube-captions",
        status: "GENERATING",
      },
    });
    lessonId = created.id;
  }

  try {
    // 3. Attempt YouTube caption fetch with Gemini fallback
    const captions = await fetchYoutubeCaptions(videoId);
    const transcriptSource = captions ? "youtube-captions" : "gemini";

    console.log(
      `[ingestLesson] Generating lesson for videoId=${videoId} using source=${transcriptSource}`
    );

    const generated: GeneratedLesson = await generateLesson(
      captions
        ? { kind: "with-captions", youtubeUrl: canonicalUrl, transcript: captions }
        : { kind: "video-only", youtubeUrl: canonicalUrl },
      options
    );

    // 4. Atomic transaction persistence
    await db.$transaction(async (tx) => {
      await tx.transcriptSegment.deleteMany({ where: { lessonId } });
      await tx.dialogueLine.deleteMany({ where: { lessonId } });
      await tx.grammarPoint.deleteMany({ where: { lessonId } });
      await tx.quizQuestion.deleteMany({ where: { lessonId } });
      await tx.vocabItem.deleteMany({ where: { lessonId } });

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          title: generated.title,
          description: generated.description,
          grammarTheme: generated.grammarTheme,
          transcriptSource,
          status: "READY",
          errorMessage: null,
          segments: {
            create: generated.transcript.map((seg, idx) => ({
              orderIndex: idx,
              startSeconds: seg.startSeconds,
              speaker: seg.speaker,
              text: seg.text,
            })),
          },
          dialogueLines: {
            create: generated.dialogueLines.map((d, idx) => ({
              orderIndex: idx + 1,
              speaker: d.speaker,
              text: d.text,
            })),
          },
          grammarPoints: {
            create: generated.grammarPoints.map((gp, idx) => ({
              orderIndex: idx + 1,
              explanation: gp.explanation,
              examples: gp.examples,
            })),
          },
          quizQuestions: {
            create: generated.quizQuestions.map((qq, idx) => ({
              orderIndex: idx + 1,
              prompt: qq.prompt,
              options: qq.options,
              correctIndex: qq.correctIndex,
            })),
          },
          vocabItems: {
            create: generated.vocabItems.map((v, idx) => ({
              orderIndex: idx + 1,
              term: v.term,
              meaning: v.meaning,
              example: v.example,
            })),
          },
        },
      });
    });

    console.log(`[ingestLesson] Successfully ingested lessonId=${lessonId}`);
    return { ok: true, lessonId, reused: false };
  } catch (error: unknown) {
    const userError = sanitizeErrorMessage(error);
    console.error(`[ingestLesson] Failed ingestion for videoId=${videoId}:`, error);

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        status: "FAILED",
        errorMessage: userError,
      },
    });

    return { ok: false, error: userError };
  }
}
