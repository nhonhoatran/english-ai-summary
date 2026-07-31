import { CatState } from "@prisma/client";

export type CatMood = "happy" | "playing" | "hungry" | "dirty" | "sleeping" | "sad";

export interface ComputeCatMoodParams {
  cat: Pick<CatState, "happiness" | "hunger" | "cleanliness">;
  todayPoints: number;
  hour: number; // 0-23 (current hour)
  streak: number;
  isOnLessonPage?: boolean;
}

/**
 * Pure function to compute cat mood based on stats, time, streak, and activity.
 */
export function computeCatMood(params: ComputeCatMoodParams): CatMood {
  const { cat, todayPoints, hour, streak, isOnLessonPage = false } = params;

  if (hour >= 22 || hour < 7) {
    return "sleeping";
  }
  if (streak === 0 && cat.happiness < 30) {
    return "sad";
  }
  if (cat.cleanliness < 30) {
    return "dirty";
  }
  if (cat.hunger > 70) {
    return "hungry";
  }
  if (todayPoints >= 10) {
    return "happy";
  }
  if (isOnLessonPage) {
    return "playing";
  }
  return "hungry";
}
