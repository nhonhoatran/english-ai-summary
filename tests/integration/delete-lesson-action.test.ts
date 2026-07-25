import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteLessonAction } from "@/app/actions/delete-lesson-action";
import { db } from "@/lib/db";
import { resetTestDatabase } from "../helpers/reset-test-database";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";

const mockGetCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockGetCookie,
  })),
}));

describe("deleteLessonAction integration", () => {
  let userA: { id: string; phone: string };
  let userB: { id: string; phone: string };

  beforeEach(async () => {
    vi.clearAllMocks();
    await resetTestDatabase();

    userA = await db.user.create({ data: { phone: "0900000001" } });
    userB = await db.user.create({ data: { phone: "0900000002" } });
  });

  it("deletes a lesson owned by the logged in user", async () => {
    const lesson = await db.lesson.create({
      data: {
        userId: userA.id,
        videoId: "dQw4w9WgXcQ",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Test Lesson",
        transcriptSource: "youtube-captions",
        status: "READY",
      },
    });

    const token = await signSession({ userId: userA.id, phone: userA.phone }, env.AUTH_SECRET);
    mockGetCookie.mockReturnValue({ name: AUTH_COOKIE_NAME, value: token });

    const res = await deleteLessonAction(lesson.id);
    expect(res.success).toBe(true);

    const found = await db.lesson.findUnique({ where: { id: lesson.id } });
    expect(found).toBeNull();
  });

  it("prevents user B from deleting user A's lesson", async () => {
    const lesson = await db.lesson.create({
      data: {
        userId: userA.id,
        videoId: "dQw4w9WgXcQ",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "User A Lesson",
        transcriptSource: "youtube-captions",
        status: "READY",
      },
    });

    // Log in as user B
    const token = await signSession({ userId: userB.id, phone: userB.phone }, env.AUTH_SECRET);
    mockGetCookie.mockReturnValue({ name: AUTH_COOKIE_NAME, value: token });

    const res = await deleteLessonAction(lesson.id);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("permission");
    }

    const found = await db.lesson.findUnique({ where: { id: lesson.id } });
    expect(found).not.toBeNull();
  });
});
