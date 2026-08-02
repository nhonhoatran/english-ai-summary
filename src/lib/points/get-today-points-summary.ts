import { db } from "@/lib/db";
import { getUtcMidnight } from "./award-points";

export interface TodayPointsSummary {
  totalToday: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Today's points plus the user's streak.
 *
 * Shared by `GET /api/points/today` and by server components that hydrate
 * `<PointsWidget />`, so the widget no longer has to fetch on mount.
 */
export async function getTodayPointsSummary(
  userId: string
): Promise<TodayPointsSummary> {
  const todayUtc = getUtcMidnight();

  const [pointsTodayAggregate, streakRecord] = await Promise.all([
    db.userPoint.aggregate({
      where: { userId, date: todayUtc },
      _sum: { points: true },
    }),
    db.userStreak.findUnique({ where: { userId } }),
  ]);

  let currentStreak = streakRecord?.currentStreak ?? 0;
  const lastActiveDate = streakRecord?.lastActiveDate;

  // A gap of more than one day means the streak is already broken, even though
  // nothing has written the reset yet.
  if (lastActiveDate) {
    const lastActiveUtc = getUtcMidnight(new Date(lastActiveDate));
    const diffDays = Math.round(
      (todayUtc.getTime() - lastActiveUtc.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 1) currentStreak = 0;
  }

  return {
    totalToday: pointsTodayAggregate._sum.points ?? 0,
    currentStreak,
    longestStreak: streakRecord?.longestStreak ?? 0,
  };
}
