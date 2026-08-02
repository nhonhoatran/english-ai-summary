import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { generateUniqueClassroomCode } from "@/lib/classroom/generate-code";
import { buildHostDisplayName } from "@/lib/classroom/display-name";
import { CLASSROOM_MEMBER_COOKIE_MAX_AGE, memberCookieName } from "@/lib/classroom/member-cookie";
import { cookies } from "next/headers";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { lessonId, name } = body;

    const className =
      typeof name === "string" && name.trim().length > 0
        ? name.trim().slice(0, 60)
        : null;

    // An existing solo lesson can seed the classroom; it gets moved into the
    // class so the class owns it from then on.
    let seedLessonId: string | null = null;
    if (lessonId) {
      const lesson = await db.lesson.findFirst({
        where: { id: lessonId, userId: session.userId },
        select: { id: true },
      });
      if (!lesson) {
        return NextResponse.json(
          { error: "Bài học không tồn tại." },
          { status: 404 }
        );
      }
      seedLessonId = lesson.id;
    }

    const code = await generateUniqueClassroomCode();
    const hostUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    });
    const hostDisplayName = buildHostDisplayName(hostUser?.phone);

    const { classroom, member } = await db.$transaction(async (tx) => {
      const created = await tx.classroom.create({
        data: {
          code,
          name: className,
          hostUserId: session.userId,
          currentLessonId: seedLessonId,
          isActive: true,
          currentTab: "summary",
          currentSegment: 0,
          lastSyncAt: new Date(),
        },
      });

      if (seedLessonId) {
        await tx.lesson.update({
          where: { id: seedLessonId },
          data: { classroomId: created.id, classroomOrder: 0 },
        });
      }

      // The host is a member too, so presence and the leaderboard include them.
      const hostMember = await tx.classMember.create({
        data: {
          classroomId: created.id,
          userId: session.userId,
          displayName: hostDisplayName,
          phone: hostUser?.phone ?? null,
          lastSeenAt: new Date(),
        },
      });

      return { classroom: created, member: hostMember };
    });

    const cookieStore = await cookies();
    cookieStore.set(memberCookieName(code), member.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: CLASSROOM_MEMBER_COOKIE_MAX_AGE,
    });

    return NextResponse.json({
      code,
      url: `/classroom/${code}`,
      classroomId: classroom.id,
      memberId: member.id,
    });
  } catch (error: unknown) {
    return handleRouteError("POST /api/classroom/create", error);
  }
}
