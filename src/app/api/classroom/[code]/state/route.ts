import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifySession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const formattedCode = code.toUpperCase();

    const classroom = await db.classroom.findUnique({
      where: { code: formattedCode },
      include: {
        host: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại." },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const memberCookie = cookieStore.get(`classroom_member_id_${formattedCode}`);
    const memberId = memberCookie?.value;

    // Update lastSeenAt if member cookie is present
    if (memberId) {
      await db.classMember.updateMany({
        where: { id: memberId, classroomId: classroom.id },
        data: { lastSeenAt: new Date() },
      }).catch(() => {}); // Ignore error if deleted
    }

    // Check if current logged-in user is host
    let isHost = false;
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (authCookie?.value) {
      const session = await verifySession(authCookie.value, env.AUTH_SECRET);
      if (session && session.userId === classroom.hostUserId) {
        isHost = true;
      }
    }

    const hostName = classroom.host?.phone
      ? `Host (${classroom.host.phone.slice(-4)})`
      : "Host";

    return NextResponse.json({
      id: classroom.id,
      code: classroom.code,
      isActive: classroom.isActive,
      currentTab: classroom.currentTab ?? "summary",
      currentSegment: classroom.currentSegment ?? 0,
      lastSyncAt: classroom.lastSyncAt,
      hostUserId: classroom.hostUserId,
      hostName,
      lessonId: classroom.lessonId,
      isHost,
    });
  } catch (error: any) {
    console.error("Error in GET /api/classroom/[code]/state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
