import "server-only";

import { db } from "@/lib/db";
import type { PracticeAttemptView } from "./practice-types";

export type { PracticeAttemptView };

const ATTEMPT_SELECT = {
  promptId: true,
  promptIndex: true,
  userId: true,
  displayName: true,
  answer: true,
  isCorrect: true,
  score: true,
  feedback: true,
  suggestion: true,
  updatedAt: true,
} as const;

type AttemptRow = {
  promptId: string;
  promptIndex: number;
  userId: string;
  displayName: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  feedback: string | null;
  suggestion: string | null;
  updatedAt: Date;
};

function toView(row: AttemptRow): PracticeAttemptView {
  return { ...row, updatedAt: row.updatedAt.toISOString() };
}

/** Every attempt this learner has made on a lesson — powers progress restore. */
export async function getOwnAttempts(
  lessonId: string,
  userId: string
): Promise<PracticeAttemptView[]> {
  const rows = await db.practiceAttempt.findMany({
    where: { lessonId, userId },
    orderBy: { promptIndex: "asc" },
    select: ATTEMPT_SELECT,
  });
  return rows.map(toView);
}

/**
 * Every classroom member's attempts on a lesson — powers the peer markers,
 * leaderboard and activity feed. Returns [] for solo lessons.
 */
export async function getClassroomAttempts(
  lessonId: string,
  classroomId: string | null
): Promise<PracticeAttemptView[]> {
  if (!classroomId) return [];

  const rows = await db.practiceAttempt.findMany({
    where: { lessonId, classroomId },
    orderBy: [{ promptIndex: "asc" }, { updatedAt: "asc" }],
    select: ATTEMPT_SELECT,
  });
  return rows.map(toView);
}

export interface SavePracticeAttemptInput {
  lessonId: string;
  promptId: string;
  promptIndex: number;
  userId: string;
  classroomId: string | null;
  displayName: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  feedback?: string | null;
  suggestion?: string | null;
}

/**
 * Upserts the learner's answer for a prompt. One row per (prompt, learner):
 * re-answering overwrites the previous grade and bumps attemptNo, so the
 * progress bar and leaderboard always reflect the latest state.
 */
export async function savePracticeAttempt(
  input: SavePracticeAttemptInput
): Promise<PracticeAttemptView> {
  const row = await db.practiceAttempt.upsert({
    where: {
      promptId_userId: { promptId: input.promptId, userId: input.userId },
    },
    create: {
      lessonId: input.lessonId,
      promptId: input.promptId,
      promptIndex: input.promptIndex,
      userId: input.userId,
      classroomId: input.classroomId,
      displayName: input.displayName,
      answer: input.answer,
      isCorrect: input.isCorrect,
      score: input.score,
      feedback: input.feedback ?? null,
      suggestion: input.suggestion ?? null,
    },
    update: {
      classroomId: input.classroomId,
      displayName: input.displayName,
      answer: input.answer,
      isCorrect: input.isCorrect,
      score: input.score,
      feedback: input.feedback ?? null,
      suggestion: input.suggestion ?? null,
      attemptNo: { increment: 1 },
    },
    select: ATTEMPT_SELECT,
  });

  return toView(row);
}
