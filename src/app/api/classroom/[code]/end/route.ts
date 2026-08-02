import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { emitToRoom } from "@/lib/realtime/emit-to-room";
import { handleRouteError } from "@/lib/api/handle-route-error";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { code } = await params;
    const formattedCode = code.toUpperCase();

    const classroom = await db.classroom.findUnique({
      where: { code: formattedCode },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại." },
        { status: 404 }
      );
    }

    if (classroom.hostUserId !== session.userId) {
      return NextResponse.json(
        { error: "Chỉ Host mới có quyền kết thúc lớp học." },
        { status: 403 }
      );
    }

    await db.classroom.update({
      where: { id: classroom.id },
      data: { isActive: false },
    });

    // Broadcast from the server, after the host check — previously the client
    // emitted "end-room" directly, so any member could close the class.
    emitToRoom(formattedCode, "room-ended");

    return NextResponse.json({ success: true, message: "Đã kết thúc lớp học." });
  } catch (error: unknown) {
    return handleRouteError("POST /api/classroom/[code]/end", error);
  }
}
