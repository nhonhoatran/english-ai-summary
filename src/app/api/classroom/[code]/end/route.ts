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
        { error: "Chỉ Host mới có quyền kết thúc lớp học." },
        { status: 403 }
      );
    }

    await db.classroom.update({
      where: { id: classroom.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Đã kết thúc lớp học." });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in POST /api/classroom/[code]/end:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
