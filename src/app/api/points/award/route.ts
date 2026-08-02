import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { awardPoints, getUtcMidnight } from "@/lib/points/award-points";
import { PointSource } from "@prisma/client";
import { db } from "@/lib/db";
import { handleRouteError } from "@/lib/api/handle-route-error";

// Simple in-memory rate limiting map: userId -> lastAwardTimestampMs
const lastAwardMap = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 1 req / 5 sec

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    // Rate limit check
    const now = Date.now();
    const lastAwardTime = lastAwardMap.get(userId) || 0;
    if (now - lastAwardTime < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few seconds." },
        { status: 429 }
      );
    }
    lastAwardMap.set(userId, now);

    const body = await request.json();
    const { source, meta } = body;

    if (!source || !Object.values(PointSource).includes(source as PointSource)) {
      return NextResponse.json({ error: "Invalid point source" }, { status: 400 });
    }

    // De-duplication check for daily_lesson
    if (source === "daily_lesson" && meta?.lessonId) {
      const todayUtc = getUtcMidnight();
      const existingAward = await db.userPoint.findFirst({
        where: {
          userId,
          source: "daily_lesson",
          date: todayUtc,
          meta: {
            path: ["lessonId"],
            equals: meta.lessonId,
          },
        },
      });

      if (existingAward) {
        // Already awarded for this lesson today
        const userStreak = await db.userStreak.findUnique({ where: { userId } });
        const pointsTodayAggregate = await db.userPoint.aggregate({
          where: { userId, date: todayUtc },
          _sum: { points: true },
        });

        return NextResponse.json({
          success: true,
          alreadyAwarded: true,
          points: 0,
          totalToday: pointsTodayAggregate._sum.points ?? 0,
          currentStreak: userStreak?.currentStreak ?? 0,
          multiplier: 1,
        });
      }
    }

    const result = await awardPoints({
      userId,
      source: source as PointSource,
      meta,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    return handleRouteError("POST /api/points/award", error);
  }
}
