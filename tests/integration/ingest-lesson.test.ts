import { describe, it, expect, beforeEach, vi } from "vitest";
import { ingestLesson } from "@/lib/ingest/ingest-lesson";
import { db } from "@/lib/db";
import { resetTestDatabase } from "../helpers/reset-test-database";
import { validGeneratedLessonFixture } from "../fixtures/generated-lesson-fixture";
import { sampleCaptionSegmentsFixture } from "../fixtures/caption-segments-fixture";

vi.mock("@/lib/ingest/fetch-youtube-captions", () => ({
  fetchYoutubeCaptions: vi.fn(),
}));

vi.mock("@/lib/gemini/generate-lesson", () => ({
  generateLesson: vi.fn(),
}));

import { fetchYoutubeCaptions } from "@/lib/ingest/fetch-youtube-captions";
import { generateLesson } from "@/lib/gemini/generate-lesson";

describe("ingestLesson integration", () => {
  let testUserId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await resetTestDatabase();
    const phone = "09" + Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
    const user = await db.user.create({ data: { phone } });
    testUserId = user.id;
    vi.mocked(generateLesson).mockResolvedValue(validGeneratedLessonFixture);
  });

  it("persists a complete READY lesson with stubbed generator and captions", async () => {
    vi.mocked(fetchYoutubeCaptions).mockResolvedValue(sampleCaptionSegmentsFixture);

    const rawUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const res = await ingestLesson(rawUrl, testUserId);

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.reused).toBe(false);

    const lesson = await db.lesson.findUnique({
      where: { id: res.lessonId },
      include: {
        segments: { orderBy: { orderIndex: "asc" } },
        grammarPoints: { orderBy: { orderIndex: "asc" } },
        quizQuestions: { orderBy: { orderIndex: "asc" } },
        vocabItems: { orderBy: { orderIndex: "asc" } },
      },
    });

    expect(lesson).not.toBeNull();
    expect(lesson?.status).toBe("READY");
    expect(lesson?.transcriptSource).toBe("youtube-captions");
    expect(lesson?.title).toBe(validGeneratedLessonFixture.title);
    expect(lesson?.segments.length).toBe(validGeneratedLessonFixture.transcript.length);
    expect(lesson?.segments[0].orderIndex).toBe(0);
    expect(lesson?.grammarPoints.length).toBe(4);
    expect(lesson?.grammarPoints[0].orderIndex).toBe(1);
    expect(lesson?.quizQuestions.length).toBe(5);
    expect(lesson?.quizQuestions[0].orderIndex).toBe(1);
    expect(lesson?.vocabItems.length).toBe(validGeneratedLessonFixture.vocabItems.length);
    expect(lesson?.vocabItems[0].orderIndex).toBe(1);
  });

  it("uses transcriptSource='gemini' when fetchYoutubeCaptions returns null", async () => {
    vi.mocked(fetchYoutubeCaptions).mockResolvedValue(null);

    const rawUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const res = await ingestLesson(rawUrl, testUserId);

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const lesson = await db.lesson.findUnique({ where: { id: res.lessonId } });
    expect(lesson?.transcriptSource).toBe("gemini");
  });

  it("reuses existing lesson for same URL for the same user", async () => {
    vi.mocked(fetchYoutubeCaptions).mockResolvedValue(sampleCaptionSegmentsFixture);

    const rawUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const firstRun = await ingestLesson(rawUrl, testUserId);
    expect(firstRun.ok).toBe(true);
    expect(generateLesson).toHaveBeenCalledTimes(1);

    const secondRun = await ingestLesson(rawUrl, testUserId);
    expect(secondRun.ok).toBe(true);
    if (secondRun.ok && firstRun.ok) {
      expect(secondRun.reused).toBe(true);
      expect(secondRun.lessonId).toBe(firstRun.lessonId);
    }
    expect(generateLesson).toHaveBeenCalledTimes(1);
  });

  it("marks status as FAILED with sanitized message when generator throws", async () => {
    vi.mocked(fetchYoutubeCaptions).mockResolvedValue(null);
    vi.mocked(generateLesson).mockRejectedValue(new Error("API quota exceeded / permission_denied"));

    const rawUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const res = await ingestLesson(rawUrl, testUserId);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("This video is private or unlisted");
    }

    const lesson = await db.lesson.findFirst({ where: { videoId: "dQw4w9WgXcQ", userId: testUserId } });
    expect(lesson?.status).toBe("FAILED");
    expect(lesson?.errorMessage).toContain("This video is private or unlisted");
  });

  it("rejects invalid URL without calling generator or touching DB", async () => {
    const res = await ingestLesson("invalid-url-string", testUserId);

    expect(res.ok).toBe(false);
    expect(generateLesson).not.toHaveBeenCalled();

    const count = await db.lesson.count();
    expect(count).toBe(0);
  });
});
