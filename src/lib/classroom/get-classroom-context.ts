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
 * Takes ownership of a pre-userId membership row for the current user.
 *
 * Returns the row only when this user now owns it; a row already claimed by
 * somebody else is ignored rather than impersonated.
 */
async function claimLegacyMembership(
  memberId: string,
  classroomId: string,
  userId: string
): Promise<{ id: string; displayName: string } | null> {
  try {
    const claimed = await db.classMember.updateMany({
      where: { id: memberId, classroomId, userId: null },
      data: { userId },
    });
    if (claimed.count === 0) return null;
  } catch {
    // Unique (classroomId, userId) race: this user already has a row here.
    return null;
  }

  return db.classMember.findUnique({
    where: { id: memberId },
    select: { id: true, displayName: true },
  });
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

  // Legacy fallback for memberships created before the userId column existed.
  //
  // This used to resolve a membership from the cookie value alone, so whoever
  // held the cookie inherited that identity — logging out and signing in with
  // another phone in the same browser rendered the previous person's name.
  // Only unclaimed rows are adoptable now, and adopting claims the row for this
  // user so it can never be handed to a second account.
  if (!member && userId) {
    const legacyMemberId = cookieStore.get(memberCookieName(formattedCode))?.value;
    if (legacyMemberId) {
      member = await claimLegacyMembership(legacyMemberId, classroom.id, userId);
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
