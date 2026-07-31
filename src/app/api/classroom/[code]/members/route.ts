import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const formattedCode = code.toUpperCase();

    const classroom = await db.classroom.findUnique({
      where: { code: formattedCode },
      select: { id: true, hostUserId: true, host: { select: { phone: true } } },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Lớp học không tồn tại." },
        { status: 404 }
      );
    }

    const tenSecondsAgo = new Date(Date.now() - 10 * 1000);

    const activeMembers = await db.classMember.findMany({
      where: {
        classroomId: classroom.id,
        lastSeenAt: { gte: tenSecondsAgo },
      },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        displayName: true,
        joinedAt: true,
        lastSeenAt: true,
      },
    });

    const hostName = classroom.host?.phone
      ? `Host (${classroom.host.phone.slice(-4)})`
      : "Host";

    const membersWithHostFlag = activeMembers.map((m) => ({
      ...m,
      isHost: m.displayName.startsWith("Host"),
    }));

    return NextResponse.json({
      members: membersWithHostFlag,
      totalOnline: membersWithHostFlag.length,
      hostName,
    });
  } catch (error: any) {
    console.error("Error in GET /api/classroom/[code]/members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
