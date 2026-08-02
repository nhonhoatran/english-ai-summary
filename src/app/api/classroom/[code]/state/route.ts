import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClassroomContext } from "@/lib/classroom/get-classroom-context";
import { buildHostDisplayName } from "@/lib/classroom/display-name";
import { handleRouteError } from "@/lib/api/handle-route-error";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const ctx = await getClassroomContext(code);

    if (!ctx) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại." },
        { status: 404 }
      );
    }

    // Heartbeat: presence itself comes from live sockets now, but keeping
    // lastSeenAt fresh still powers the "last active" column for the host.
    if (ctx.member) {
      await db.classMember
        .update({
          where: { id: ctx.member.id },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => {}); // member may have been removed mid-request
    }

    const { classroom } = ctx;

    return NextResponse.json({
      id: classroom.id,
      code: classroom.code,
      name: classroom.name,
      isActive: classroom.isActive,
      currentTab: classroom.currentTab ?? "summary",
      currentSegment: classroom.currentSegment ?? 0,
      hostUserId: classroom.hostUserId,
      hostName: buildHostDisplayName(classroom.hostPhone),
      currentLessonId: classroom.currentLessonId,
      isHost: ctx.isHost,
    });
  } catch (error: unknown) {
    return handleRouteError("GET /api/classroom/[code]/state", error);
  }
}
