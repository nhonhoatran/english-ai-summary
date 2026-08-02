import "server-only";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifySession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";
import { memberCookieName } from "./member-cookie";

export interface ClassroomContext {
  classroom: {
    id: string;
    code: string;
    name: string | null;
    hostUserId: string;
    hostPhone: string | null;
    isActive: boolean;
    currentLessonId: string | null;
    currentTab: string | null;
    currentSegment: number | null;
  };
  /** Logged-in user id, or null when the auth cookie is missing/expired. */
  userId: string | null;
  /** ClassMember row for this viewer, or null when they have not joined yet. */
  member: { id: string; displayName: string } | null;
  isHost: boolean;
}

/**
 * Single source of truth for "who is looking at this classroom".
 *
 * Membership is resolved by userId first (every route is auth-gated, so the
 * user is the durable identity) and falls back to the legacy per-class cookie
 * for members who joined before memberships carried a userId.
 */
export async function getClassroomContext(
  code: string
): Promise<ClassroomContext | null> {
  const formattedCode = code.toUpperCase();

  const classroom = await db.classroom.findUnique({
    where: { code: formattedCode },
    select: {
      id: true,
      code: true,
      name: true,
      hostUserId: true,
      isActive: true,
      currentLessonId: true,
      currentTab: true,
      currentSegment: true,
      host: { select: { phone: true } },
    },
  });

  if (!classroom) return null;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const session = await verifySession(authCookie?.value, env.AUTH_SECRET);
  const userId = session?.userId ?? null;

  let member = userId
    ? await db.classMember.findUnique({
        where: { classroomId_userId: { classroomId: classroom.id, userId } },
        select: { id: true, displayName: true },
      })
    : null;

  if (!member) {
    const legacyMemberId = cookieStore.get(memberCookieName(formattedCode))?.value;
    if (legacyMemberId) {
      member = await db.classMember.findFirst({
        where: { id: legacyMemberId, classroomId: classroom.id },
        select: { id: true, displayName: true },
      });
    }
  }

  return {
    classroom: {
      id: classroom.id,
      code: classroom.code,
      name: classroom.name,
      hostUserId: classroom.hostUserId,
      hostPhone: classroom.host?.phone ?? null,
      isActive: classroom.isActive,
      currentLessonId: classroom.currentLessonId,
      currentTab: classroom.currentTab,
      currentSegment: classroom.currentSegment,
    },
    userId,
    member,
    isHost: !!userId && userId === classroom.hostUserId,
  };
}
