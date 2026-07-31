import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { generateUniqueClassroomCode } from "@/lib/classroom/generate-code";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Thiếu thông tin bài học (lessonId)." },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Bài học không tồn tại." },
        { status: 404 }
      );
    }

    const code = await generateUniqueClassroomCode();

    const classroom = await db.classroom.create({
      data: {
        code,
        hostUserId: session.userId,
        lessonId,
        isActive: true,
        currentTab: "summary",
        currentSegment: 0,
        lastSyncAt: new Date(),
      },
    });

    // Automatically add host as a ClassMember
    const hostUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    });
    const hostDisplayName = hostUser?.phone
      ? `Host (${hostUser.phone.slice(-4)})`
      : "Host";

    const member = await db.classMember.create({
      data: {
        classroomId: classroom.id,
        displayName: hostDisplayName,
        lastSeenAt: new Date(),
      },
    });

    // Set member cookie for host
    const cookieStore = await cookies();
    cookieStore.set(`classroom_member_id_${code}`, member.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      code,
      url: `/classroom/${code}`,
      classroomId: classroom.id,
      memberId: member.id,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in POST /api/classroom/create:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
