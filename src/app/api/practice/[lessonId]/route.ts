import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { resolvePracticeAccess } from "@/lib/practice/practice-access";
import { handleRouteError } from "@/lib/api/handle-route-error";
import {
  getClassroomAttempts,
  getOwnAttempts,
} from "@/lib/practice/practice-attempts";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

/**
 * Full practice state for a lesson: the caller's own attempts (progress
 * restore) plus every classmate's attempts (peer markers, leaderboard, feed).
 * The client re-fetches this after a socket reconnect so it never drifts.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { lessonId } = await params;

    const access = await resolvePracticeAccess(lessonId, session.userId);
    if (!access) {
      return NextResponse.json(
        { error: "Không tìm thấy bài học hoặc bạn không có quyền xem." },
        { status: 404 }
      );
    }

    const [ownAttempts, classroomAttempts] = await Promise.all([
      getOwnAttempts(lessonId, session.userId),
      getClassroomAttempts(lessonId, access.classroomId),
    ]);

    return NextResponse.json({
      userId: session.userId,
      displayName: access.displayName,
      classroomCode: access.classroomCode,
      ownAttempts,
      classroomAttempts,
    });
  } catch (error: unknown) {
    return handleRouteError("GET /api/practice/[lessonId]", error);
  }
}
