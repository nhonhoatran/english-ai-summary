import { db } from "@/lib/db";
import { PointSource } from "@prisma/client";

export function getUtcMidnight(dateInput: Date = new Date()): Date {
  return new Date(
    Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate()
    )
  );
}

export interface AwardPointsOptions {
  userId: string;
  source: PointSource;
  meta?: Record<string, any>;
}

export interface AwardPointsResult {
  points: number;
  totalToday: number;
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
}

export async function awardPoints({
  userId,
  source,
  meta,
}: AwardPointsOptions): Promise<AwardPointsResult> {
  // 1. Determine base points
  let basePoints = 10;

  switch (source) {
    case "daily_lesson":
      basePoints = 10;
      break;
    case "quiz_complete": {
      // score expected to be 0..5 (number of correct answers out of 5)
      const score = typeof meta?.score === "number" ? meta.score : 5;
      basePoints = Math.floor((Math.max(0, Math.min(5, score)) / 5) * 15);
      break;
    }
    case "writing_correct":
      basePoints = 3;
      break;
    case "flashcard_review":
      basePoints = 2;
      break;
    case "streak_bonus":
      basePoints = 10;
      break;
  }

  // 2. Load or create UserStreak
  const streakRecord = await db.userStreak.findUnique({
    where: { userId },
  });

  const todayUtc = getUtcMidnight(new Date());

  let currentStreak = streakRecord?.currentStreak ?? 0;
  let longestStreak = streakRecord?.longestStreak ?? 0;
  const lastActiveDate = streakRecord?.lastActiveDate;

  if (!lastActiveDate) {
    currentStreak = 1;
  } else {
    const lastActiveUtc = getUtcMidnight(new Date(lastActiveDate));
    const diffMs = todayUtc.getTime() - lastActiveUtc.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already active today, streak stays currentStreak
      if (currentStreak === 0) currentStreak = 1;
    } else if (diffDays === 1) {
      // Active yesterday, streak continues!
      currentStreak += 1;
    } else {
      // Gap > 1 day, reset streak
      currentStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // Update or Create UserStreak
  await db.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak,
      longestStreak,
      lastActiveDate: new Date(),
    },
    update: {
      currentStreak,
      longestStreak,
      lastActiveDate: new Date(),
    },
  });

  // 3. Multiplier calculation
  let multiplier = 1;
  if (currentStreak >= 30) {
    multiplier = 3;
  } else if (currentStreak >= 7) {
    multiplier = 2;
  }

  const finalPoints = Math.round(basePoints * multiplier);

  // 4. Record UserPoint
  await db.userPoint.create({
    data: {
      userId,
      date: todayUtc,
      source,
      points: finalPoints,
      meta: meta ? meta : undefined,
    },
  });

  // 5. Calculate total today
  const pointsTodayAggregate = await db.userPoint.aggregate({
    where: {
      userId,
      date: todayUtc,
    },
    _sum: {
      points: true,
    },
  });

  const totalToday = pointsTodayAggregate._sum.points ?? 0;

  return {
    points: finalPoints,
    totalToday,
    currentStreak,
    longestStreak,
    multiplier,
  };
}
