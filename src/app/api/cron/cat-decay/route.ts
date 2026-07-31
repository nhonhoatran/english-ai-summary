import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getUtcMidnight } from "@/lib/points/award-points";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedSecret = env.CRON_SECRET || process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Calculate yesterday UTC date
    const todayUtc = getUtcMidnight();
    const yesterdayUtc = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);

    // 2. Fetch all CatStates
    const catStates = await db.catState.findMany({
      include: {
        user: {
          include: {
            userStreak: true,
          },
        },
      },
    });

    let updatedCount = 0;

    for (const cat of catStates) {
      // Fetch yesterday's earned points
      const yesterdayPointsAgg = await db.userPoint.aggregate({
        where: {
          userId: cat.userId,
          date: yesterdayUtc,
          points: { gt: 0 },
        },
        _sum: { points: true },
      });
      const yesterdayPoints = yesterdayPointsAgg._sum.points ?? 0;

      const userStreak = cat.user.userStreak?.currentStreak ?? 0;

      let newHunger = cat.hunger + 30;
      if (yesterdayPoints === 0) {
        newHunger += 20; // Total +50 if didn't practice yesterday
      }

      let newCleanliness = cat.cleanliness - 20;
      if (cat.cleanliness < 30) {
        newCleanliness -= 20; // Total -40 if already dirty
      }

      let newHappiness = cat.happiness - 10;
      if (userStreak === 0) {
        newHappiness -= 10; // Total -20 if no streak
      }

      // Clamp all to [0, 100]
      newHunger = Math.min(100, Math.max(0, newHunger));
      newCleanliness = Math.min(100, Math.max(0, newCleanliness));
      newHappiness = Math.min(100, Math.max(0, newHappiness));

      await db.catState.update({
        where: { id: cat.id },
        data: {
          hunger: newHunger,
          cleanliness: newCleanliness,
          happiness: newHappiness,
          petCount: 0,
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in POST /api/cron/cat-decay:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
