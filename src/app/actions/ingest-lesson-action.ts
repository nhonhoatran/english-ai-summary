// path/to/src/app/actions/ingest-lesson-action.ts
"use server";

import { revalidatePath } from "next/cache";
import { ingestLesson } from "@/lib/ingest/ingest-lesson";
import { requireAuth } from "@/lib/auth/require-auth";
import { LessonAnalysisOptions } from "@/lib/gemini/prompt-lesson-analysis";
import { emitToRoom } from "@/lib/realtime/emit-to-room";

import { db } from "@/lib/db";

export type IngestActionResult =
  | { success: true; lessonId: string; reused: boolean }
  | { success: false; error: string };

export async function ingestLessonAction(
  url: string,
  options?: LessonAnalysisOptions,
  classroomCode?: string
): Promise<IngestActionResult> {
  const session = await requireAuth();

  if (!url || typeof url !== "string") {
    return { success: false, error: "Please enter a YouTube video URL." };
  }

  // Resolve + authorize the classroom before spending minutes on AI generation.
  let classroom: {
    id: string;
    code: string;
    currentLessonId: string | null;
    hostUserId: string;
  } | null = null;

  if (classroomCode) {
    classroom = await db.classroom.findUnique({
      where: { code: classroomCode.toUpperCase() },
      select: { id: true, code: true, currentLessonId: true, hostUserId: true },
    });

    if (!classroom) {
      return { success: false, error: "Lớp học không tồn tại." };
    }
    if (classroom.hostUserId !== session.userId) {
      return { success: false, error: "Chỉ Host mới được thêm bài học vào lớp." };
    }
  }

  const result = await ingestLesson(url, session.userId, options, classroom?.id);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  if (classroom) {
    // Only auto-select the new lesson when the class isn't on one yet — never
    // yank the whole class off a lesson they are in the middle of.
    if (!classroom.currentLessonId) {
      await db.classroom.update({
        where: { id: classroom.id },
        data: { currentLessonId: result.lessonId, lastSyncAt: new Date() },
      });
    }

    emitToRoom(classroom.code, "lessons-changed", {
      lessonId: result.lessonId,
      autoSelected: !classroom.currentLessonId,
    });
    revalidatePath(`/classroom/${classroom.code}`);
  }

  revalidatePath("/");

  return {
    success: true,
    lessonId: result.lessonId,
    reused: result.reused,
  };
}
