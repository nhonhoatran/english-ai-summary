import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/require-auth";
import { sanitizeDisplayName } from "@/lib/classroom/display-name";
import {
  CLASSROOM_MEMBER_COOKIE_MAX_AGE,
  memberCookieName,
} from "@/lib/classroom/member-cookie";
import { emitToRoom } from "@/lib/realtime/emit-to-room";
import { handleRouteError } from "@/lib/api/handle-route-error";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { code } = await params;
    const body = await req.json().catch(() => ({}));

    const displayName = sanitizeDisplayName(body?.displayName);
    if (!displayName) {
      return NextResponse.json(
        { error: "Tên hiển thị phải từ 1 đến 30 ký tự." },
        { status: 400 }
      );
    }

    const classroom = await db.classroom.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, code: true, isActive: true, currentLessonId: true },
    });

    if (!classroom || !classroom.isActive) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại hoặc đã kết thúc." },
        { status: 404 }
      );
    }

    // Identity is the logged-in user, not the typed name — otherwise picking a
    // name someone else already used would hand over their membership row.
    const existingForUser = await db.classMember.findUnique({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: session.userId },
      },
    });

    const nameOwner = await db.classMember.findUnique({
      where: {
        classroomId_displayName: { classroomId: classroom.id, displayName },
      },
      select: { id: true },
    });

    if (nameOwner && nameOwner.id !== existingForUser?.id) {
      return NextResponse.json(
        { error: "Tên này đã có người dùng trong lớp, chọn tên khác nghen." },
        { status: 409 }
      );
    }

    const member = existingForUser
      ? await db.classMember.update({
          where: { id: existingForUser.id },
          data: { displayName, lastSeenAt: new Date() },
        })
      : await db.classMember.create({
          data: {
            classroomId: classroom.id,
            userId: session.userId,
            displayName,
            phone: session.phone ?? null,
            lastSeenAt: new Date(),
          },
        });

    const cookieStore = await cookies();
    cookieStore.set(memberCookieName(classroom.code), member.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: CLASSROOM_MEMBER_COOKIE_MAX_AGE,
    });

    if (!existingForUser) {
      emitToRoom(classroom.code, "member-joined", {
        memberId: member.id,
        displayName: member.displayName,
      });
    }

    return NextResponse.json({
      memberId: member.id,
      displayName: member.displayName,
      classroom: {
        id: classroom.id,
        code: classroom.code,
        currentLessonId: classroom.currentLessonId,
        isActive: classroom.isActive,
      },
    });
  } catch (error: unknown) {
    return handleRouteError("POST /api/classroom/[code]/join", error);
  }
}
