import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    let { displayName, phone } = body;

    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập tên hiển thị." },
        { status: 400 }
      );
    }

    // Clean display name
    displayName = displayName.trim().replace(/<[^>]*>?/gm, "");
    if (displayName.length === 0 || displayName.length > 30) {
      return NextResponse.json(
        { error: "Tên hiển thị phải từ 1 đến 30 ký tự." },
        { status: 400 }
      );
    }

    // Load classroom
    const classroom = await db.classroom.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!classroom || !classroom.isActive) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại hoặc đã kết thúc." },
        { status: 404 }
      );
    }

    // Check if displayName already exists in this classroom
    const existingMember = await db.classMember.findUnique({
      where: {
        classroomId_displayName: {
          classroomId: classroom.id,
          displayName,
        },
      },
    });

    let member = existingMember;

    if (!member) {
      member = await db.classMember.create({
        data: {
          classroomId: classroom.id,
          displayName,
          phone: phone ? String(phone).trim() : null,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // Update lastSeenAt for existing member re-joining
      member = await db.classMember.update({
        where: { id: member.id },
        data: { lastSeenAt: new Date() },
      });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(`classroom_member_id_${classroom.code}`, member.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      memberId: member.id,
      displayName: member.displayName,
      classroom: {
        id: classroom.id,
        code: classroom.code,
        lessonId: classroom.lessonId,
        isActive: classroom.isActive,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/classroom/[code]/join:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
