import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { getTodayUserPoints, getUserPointsBalance } from "@/lib/points/get-user-points";
import { getUtcMidnight } from "@/lib/points/award-points";
import { computeCatMood } from "@/lib/cat/compute-cat-mood";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const isOnLessonPage = searchParams.get("isOnLessonPage") === "true";

    // 1. Get or create CatState
    let catState = await db.catState.findUnique({ where: { userId } });

    if (!catState) {
      catState = await db.catState.create({
        data: {
          userId,
          happiness: 80,
          hunger: 0,
          cleanliness: 100,
          petCount: 0,
        },
      });
    }

    // 2. Reset petCount if lastPettedAt was before today
    const todayUtc = getUtcMidnight();
    if (catState.lastPettedAt && catState.lastPettedAt < todayUtc) {
      catState = await db.catState.update({
        where: { userId },
        data: { petCount: 0 },
      });
    }

    // 3. Fetch user points & streak
    const [todayPoints, pointsBalance, streakRecord] = await Promise.all([
      getTodayUserPoints(userId),
      getUserPointsBalance(userId),
      db.userStreak.findUnique({ where: { userId } }),
    ]);

    const currentStreak = streakRecord?.currentStreak ?? 0;
    const currentHour = new Date().getHours();

    // 4. Compute cat mood
    const mood = computeCatMood({
      cat: catState,
      todayPoints,
      hour: currentHour,
      streak: currentStreak,
      isOnLessonPage,
    });

    return NextResponse.json({
      catState,
      mood,
      todayPoints,
      pointsBalance,
    });
  } catch (error: unknown) {
    return handleRouteError("GET /api/cat", error);
  }
}
