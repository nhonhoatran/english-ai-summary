import "server-only";

import { db } from "@/lib/db";

export interface PracticeAccess {
  lessonId: string;
  targetLanguage: string;
  /** Classroom the lesson belongs to, or null for a solo lesson. */
  classroomId: string | null;
  classroomCode: string | null;
  /** Name to show for this learner in the classroom feed / leaderboard. */
  displayName: string;
}

/**
 * Decides whether `userId` may practise `lessonId`, and under which identity.
 *
 * A learner qualifies when they own the lesson (solo practice) or when the
 * lesson belongs to a classroom they are a member of. The previous check only
 * matched the lesson owner, so every student in a class got a 404 the moment
 * they pressed "Check answer".
 */
export async function resolvePracticeAccess(
  lessonId: string,
  userId: string
): Promise<PracticeAccess | null> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      userId: true,
      targetLanguage: true,
      classroomId: true,
      classroom: { select: { id: true, code: true } },
    },
  });

  if (!lesson) return null;

  const isOwner = lesson.userId === userId;

  const membership = lesson.classroomId
    ? await db.classMember.findUnique({
        where: {
          classroomId_userId: { classroomId: lesson.classroomId, userId },
        },
        select: { displayName: true },
      })
    : null;

  if (!isOwner && !membership) return null;

  let displayName = membership?.displayName ?? null;
  if (!displayName) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    displayName = user?.phone ? `Học viên (${user.phone.slice(-4)})` : "Học viên";
  }

  return {
    lessonId: lesson.id,
    targetLanguage: lesson.targetLanguage,
    classroomId: lesson.classroom?.id ?? null,
    classroomCode: lesson.classroom?.code ?? null,
    displayName,
  };
}
