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
    const MAX_FREE_PETS = 3;

    // 1. Load CatState
    let catState = await db.catState.findUnique({ where: { userId } });
    if (!catState) {
      catState = await db.catState.create({
        data: { userId, happiness: 80, hunger: 0, cleanliness: 100, petCount: 0 },
      });
    }

    // 2. Check if lastPettedAt was before today, reset petCount if so
    const todayUtc = getUtcMidnight();
    let currentPetCount = catState.petCount;
    if (catState.lastPettedAt && catState.lastPettedAt < todayUtc) {
      currentPetCount = 0;
    }

    if (currentPetCount >= MAX_FREE_PETS) {
      return NextResponse.json(
        { error: "Hôm nay bạn đã vuốt ve mèo 3 lần rồi, mai quay lại nhé!" },
        { status: 400 }
      );
    }

    // 3. Update CatState
    const updatedHappiness = Math.min(100, catState.happiness + 15);
    const newPetCount = currentPetCount + 1;

    catState = await db.catState.update({
      where: { userId },
      data: {
        petCount: newPetCount,
        happiness: updatedHappiness,
        lastPettedAt: new Date(),
      },
    });

    // 4. Fetch updated stats and return
    const [todayPoints, pointsBalance, streakRecord] = await Promise.all([
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
      pointsBalance,
      remainingPets: MAX_FREE_PETS - newPetCount,
      message: `Vuốt ve mèo thích thú lắm! (Còn ${MAX_FREE_PETS - newPetCount} lượt miễn phí hôm nay)`,
    });
  } catch (error: unknown) {
    return handleRouteError("POST /api/cat/pet", error);
  }
}
