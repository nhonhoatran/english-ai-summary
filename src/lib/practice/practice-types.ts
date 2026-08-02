/**
 * Shapes shared between the server (persistence, socket payloads) and the
 * client components. Kept free of `server-only` so client bundles can import
 * the types without pulling in Prisma.
 */

/** One learner's latest graded answer for a single writing prompt. */
export interface PracticeAttemptView {
  promptId: string;
  promptIndex: number;
  userId: string;
  displayName: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  feedback: string | null;
  suggestion: string | null;
  /** ISO string — Date objects do not survive the server/client boundary. */
  updatedAt: string;
}

/** Payload broadcast on the `practice-attempt` socket event. */
export interface PracticeAttemptEvent {
  lessonId: string;
  attempt: PracticeAttemptView;
}

/** A learner's roll-up, derived from their attempts on one lesson. */
export interface PracticeLeaderboardRow {
  userId: string;
  displayName: string;
  answered: number;
  correct: number;
  averageScore: number;
  lastActiveAt: string;
}

/**
 * Collapses raw attempts into per-learner standings, ranked by correct answers
 * then average score. Pure so both the leaderboard and the feed can reuse it.
 */
export function buildLeaderboard(
  attempts: PracticeAttemptView[]
): PracticeLeaderboardRow[] {
  const byUser = new Map<string, PracticeAttemptView[]>();

  for (const attempt of attempts) {
    const bucket = byUser.get(attempt.userId);
    if (bucket) bucket.push(attempt);
    else byUser.set(attempt.userId, [attempt]);
  }

  const rows: PracticeLeaderboardRow[] = [];
  for (const [userId, userAttempts] of byUser) {
    const correct = userAttempts.filter((a) => a.isCorrect).length;
    const totalScore = userAttempts.reduce((sum, a) => sum + a.score, 0);
    const lastActiveAt = userAttempts.reduce(
      (latest, a) => (a.updatedAt > latest ? a.updatedAt : latest),
      userAttempts[0].updatedAt
    );

    rows.push({
      userId,
      displayName: userAttempts[userAttempts.length - 1].displayName,
      answered: userAttempts.length,
      correct,
      averageScore: Math.round(totalScore / userAttempts.length),
      lastActiveAt,
    });
  }

  return rows.sort(
    (a, b) =>
      b.correct - a.correct ||
      b.averageScore - a.averageScore ||
      a.displayName.localeCompare(b.displayName)
  );
}

/**
 * Where a learner should resume: the first prompt with no attempt yet, or the
 * last prompt when every one has been answered.
 */
export function firstUnansweredIndex(
  promptIds: string[],
  ownAttempts: PracticeAttemptView[]
): number {
  const answered = new Set(ownAttempts.map((a) => a.promptId));
  const index = promptIds.findIndex((id) => !answered.has(id));
  if (index === -1) return Math.max(0, promptIds.length - 1);
  return index;
}

/** Merge an incoming attempt into a list, replacing the learner's older row. */
export function mergeAttempt(
  attempts: PracticeAttemptView[],
  incoming: PracticeAttemptView
): PracticeAttemptView[] {
  const next = attempts.filter(
    (a) => !(a.promptId === incoming.promptId && a.userId === incoming.userId)
  );
  next.push(incoming);
  return next.sort(
    (a, b) => a.promptIndex - b.promptIndex || a.updatedAt.localeCompare(b.updatedAt)
  );
}
