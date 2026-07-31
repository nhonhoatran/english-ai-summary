import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUtcMidnight } from "@/lib/points/award-points";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const todayUtc = getUtcMidnight();

    const [pointsTodayAggregate, streakRecord] = await Promise.all([
      db.userPoint.aggregate({
        where: {
          userId,
          date: todayUtc,
        },
        _sum: {
          points: true,
        },
      }),
      db.userStreak.findUnique({
        where: { userId },
      }),
    ]);

    let currentStreak = streakRecord?.currentStreak ?? 0;
    const lastActiveDate = streakRecord?.lastActiveDate;

    // Check if streak was broken yesterday (gap > 1 day)
    if (lastActiveDate) {
      const lastActiveUtc = getUtcMidnight(new Date(lastActiveDate));
      const diffMs = todayUtc.getTime() - lastActiveUtc.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }

    return NextResponse.json({
      totalToday: pointsTodayAggregate._sum.points ?? 0,
      currentStreak,
      longestStreak: streakRecord?.longestStreak ?? 0,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/points/today:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
