import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { getTodayUserPoints, getUserPointsBalance } from "@/lib/points/get-user-points";
import { getUtcMidnight } from "@/lib/points/award-points";
import { computeCatMood } from "@/lib/cat/compute-cat-mood";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function POST() {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const BATH_COST = 10;

    // 1. Check points balance
    const balance = await getUserPointsBalance(userId);
    if (balance < BATH_COST) {
      return NextResponse.json(
        { error: `Bạn cần ít nhất ${BATH_COST} điểm để tắm cho mèo.` },
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
        source: "cat_bath",
        points: -BATH_COST,
      },
    });

    // 4. Update CatState
    const updatedCleanliness = Math.min(100, catState.cleanliness + 50);
    const updatedHappiness = Math.min(100, catState.happiness + 5);

    catState = await db.catState.update({
      where: { userId },
      data: {
        cleanliness: updatedCleanliness,
        happiness: updatedHappiness,
        lastBathedAt: new Date(),
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
      message: "Tắm cho mèo sạch sẽ rồi nè! (-10 điểm)",
    });
  } catch (error: unknown) {
    return handleRouteError("POST /api/cat/bath", error);
  }
}
