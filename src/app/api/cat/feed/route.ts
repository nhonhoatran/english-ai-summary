import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { getTodayUserPoints, getUserPointsBalance } from "@/lib/points/get-user-points";
import { getUtcMidnight } from "@/lib/points/award-points";
import { computeCatMood } from "@/lib/cat/compute-cat-mood";

export async function POST() {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const FEED_COST = 5;

    // 1. Check points balance
    const balance = await getUserPointsBalance(userId);
    if (balance < FEED_COST) {
      return NextResponse.json(
        { error: `Bạn cần ít nhất ${FEED_COST} điểm để cho mèo ăn.` },
        { status: 400 }
      );
    }

    // 2. Load CatState
    let catState = await db.catState.findUnique({ where: { userId } });
    if (!catState) {
      catState = await db.catState.create({
        data: { userId, happiness: 80, hunger: 0, cleanliness: 100, petCount: 0 },
      });
    }

    // 3. Deduct points first
    const todayUtc = getUtcMidnight();
    await db.userPoint.create({
      data: {
        userId,
        date: todayUtc,
        source: "cat_feed",
        points: -FEED_COST,
      },
    });

    // 4. Update CatState
    const updatedHunger = Math.max(0, catState.hunger - 30);
    const updatedHappiness = Math.min(100, catState.happiness + 10);

    catState = await db.catState.update({
      where: { userId },
      data: {
        hunger: updatedHunger,
        happiness: updatedHappiness,
        lastFedAt: new Date(),
      },
    });

    // 5. Fetch updated stats and return
    const [todayPoints, newBalance, streakRecord] = await Promise.all([
      getTodayUserPoints(userId),
      getUserPointsBalance(userId),
      db.userStreak.findUnique({ where: { userId } }),
    ]);

    const mood = computeCatMood({
      cat: catState,
      todayPoints,
      hour: new Date().getHours(),
      streak: streakRecord?.currentStreak ?? 0,
    });

    return NextResponse.json({
      catState,
      mood,
      pointsBalance: newBalance,
      message: "Cho mèo ăn thành công! (-5 điểm)",
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in POST /api/cat/feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
