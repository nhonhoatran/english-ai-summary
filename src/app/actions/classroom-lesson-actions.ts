"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { revalidatePath } from "next/cache";
import { emitToRoom } from "@/lib/realtime/emit-to-room";

export type ClassroomLessonResult =
  | { success: true }
  | { success: false; error: string };

/** Resolves the classroom and asserts the caller hosts it. */
async function requireHostedClassroom(code: string) {
  const session = await requireAuth();
  const classroom = await db.classroom.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, hostUserId: true, currentLessonId: true },
  });

  if (!classroom) {
    return { ok: false as const, error: "Lớp học không tồn tại." };
  }
  if (classroom.hostUserId !== session.userId) {
    return { ok: false as const, error: "Chỉ Host mới có quyền làm việc này." };
  }
  return { ok: true as const, classroom };
}

/**
 * Switches the whole class onto another lesson it already owns and tells every
 * connected member, so students are not left staring at a lesson nobody is on.
 */
export async function selectClassroomLessonAction(
  code: string,
  lessonId: string
): Promise<ClassroomLessonResult> {
  const guard = await requireHostedClassroom(code);
  if (!guard.ok) return { success: false, error: guard.error };

  const { classroom } = guard;

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, classroomId: classroom.id },
    select: { id: true, title: true },
  });

  if (!lesson) {
    return { success: false, error: "Bài học không thuộc lớp này." };
  }

  await db.classroom.update({
    where: { id: classroom.id },
    data: {
      currentLessonId: lesson.id,
      currentTab: "summary",
      currentSegment: 0,
      lastSyncAt: new Date(),
    },
  });

  emitToRoom(classroom.code, "lesson-switched", {
    lessonId: lesson.id,
    title: lesson.title,
  });
  revalidatePath(`/classroom/${classroom.code}`);

  return { success: true };
}

/**
 * Deletes one lesson out of a classroom. If it was the lesson the class was on,
 * the class falls back to the next remaining lesson rather than going blank.
 */
export async function removeClassroomLessonAction(
  code: string,
  lessonId: string
): Promise<ClassroomLessonResult> {
  const guard = await requireHostedClassroom(code);
  if (!guard.ok) return { success: false, error: guard.error };

  const { classroom } = guard;

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, classroomId: classroom.id },
    select: { id: true },
  });

  if (!lesson) {
    return { success: false, error: "Bài học không thuộc lớp này." };
  }

  const wasCurrent = classroom.currentLessonId === lesson.id;

  await db.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id: lesson.id } });

    if (wasCurrent) {
      const next = await tx.lesson.findFirst({
        where: { classroomId: classroom.id },
        orderBy: [{ classroomOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });

      await tx.classroom.update({
        where: { id: classroom.id },
        data: {
          currentLessonId: next?.id ?? null,
          currentTab: "summary",
          currentSegment: 0,
          lastSyncAt: new Date(),
        },
      });
    }
  });

  emitToRoom(classroom.code, "lessons-changed", { removedLessonId: lesson.id });
  revalidatePath(`/classroom/${classroom.code}`);
  revalidatePath("/");

  return { success: true };
}
