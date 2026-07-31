import { db } from "@/lib/db";
import { getUtcMidnight } from "./award-points";

/**
 * Returns the net points balance for a given user (sum of all earned/spent points).
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
  const aggregate = await db.userPoint.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return aggregate._sum.points ?? 0;
}

/**
 * Returns the total positive points earned by a user today (UTC).
 */
export async function getTodayUserPoints(userId: string): Promise<number> {
  const todayUtc = getUtcMidnight();
  const aggregate = await db.userPoint.aggregate({
    where: {
      userId,
      date: todayUtc,
      points: { gt: 0 },
    },
    _sum: { points: true },
  });
  return aggregate._sum.points ?? 0;
}
