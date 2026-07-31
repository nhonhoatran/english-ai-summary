import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";

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
        { error: "Chỉ Host mới có quyền đồng bộ lớp học." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currentTab, currentSegment } = body;

    const updated = await db.classroom.update({
      where: { id: classroom.id },
      data: {
        currentTab: typeof currentTab === "string" ? currentTab : classroom.currentTab,
        currentSegment: typeof currentSegment === "number" ? currentSegment : classroom.currentSegment,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      currentTab: updated.currentTab,
      currentSegment: updated.currentSegment,
      lastSyncAt: updated.lastSyncAt,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in POST /api/classroom/[code]/sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
