import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUtcMidnight } from "@/lib/points/award-points";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const todayUtc = getUtcMidnight();
    const thirtyDaysAgoUtc = new Date(todayUtc.getTime() - 29 * 24 * 60 * 60 * 1000);

    const pointsList = await db.userPoint.groupBy({
      by: ["date"],
      where: {
        userId,
        date: {
          gte: thirtyDaysAgoUtc,
          lte: todayUtc,
        },
      },
      _sum: {
        points: true,
      },
    });

    const pointsMap = new Map<string, number>();
    pointsList.forEach((item) => {
      const dateStr = item.date.toISOString().split("T")[0];
      pointsMap.set(dateStr, item._sum.points ?? 0);
    });

    // Build complete array of 30 days
    const history: Array<{ date: string; points: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayUtc.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      history.push({
        date: dateStr,
        points: pointsMap.get(dateStr) ?? 0,
      });
    }

    return NextResponse.json({ history });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/points/history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
