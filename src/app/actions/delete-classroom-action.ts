"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { revalidatePath } from "next/cache";
import { emitToRoom } from "@/lib/realtime/emit-to-room";

export type DeleteClassroomResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Hard-deletes a classroom. Cascades take care of its lessons, members and
 * practice attempts (see the v4 migration), so this is a genuinely permanent
 * removal — the caller must confirm with the user first.
 *
 * `confirmCode` must match the classroom code; the UI makes the host retype it.
 */
export async function deleteClassroomAction(
  code: string,
  confirmCode: string
): Promise<DeleteClassroomResult> {
  const session = await requireAuth();

  if (!code || typeof code !== "string") {
    return { success: false, error: "Thiếu mã lớp học." };
  }

  const formattedCode = code.toUpperCase();

  if (String(confirmCode ?? "").trim().toUpperCase() !== formattedCode) {
    return { success: false, error: "Mã xác nhận không khớp." };
  }

  try {
    const classroom = await db.classroom.findUnique({
      where: { code: formattedCode },
      select: { id: true, hostUserId: true },
    });

    if (!classroom) {
      return { success: false, error: "Lớp học không tồn tại." };
    }

    if (classroom.hostUserId !== session.userId) {
      return { success: false, error: "Chỉ Host mới có quyền xóa lớp học." };
    }

    // Tell anyone still in the room before the row disappears.
    emitToRoom(formattedCode, "room-deleted");

    await db.classroom.delete({ where: { id: classroom.id } });

    try {
      revalidatePath("/");
    } catch {
      // revalidatePath throws outside a request scope (e.g. unit tests)
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Không xóa được lớp học.";
    console.error("[deleteClassroomAction error]:", message);
    return { success: false, error: message };
  }
}

export interface ClassroomDeletionSummary {
  lessonCount: number;
  memberCount: number;
}

/** Counts shown in the confirmation dialog so the host knows what they lose. */
export async function getClassroomDeletionSummary(
  code: string
): Promise<ClassroomDeletionSummary | null> {
  const session = await requireAuth();

  const classroom = await db.classroom.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      hostUserId: true,
      _count: { select: { lessons: true, members: true } },
    },
  });

  if (!classroom || classroom.hostUserId !== session.userId) return null;

  return {
    lessonCount: classroom._count.lessons,
    memberCount: classroom._count.members,
  };
}
