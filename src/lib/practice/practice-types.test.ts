import { describe, it, expect } from "vitest";
import {
  buildLeaderboard,
  firstUnansweredIndex,
  mergeAttempt,
  type PracticeAttemptView,
} from "./practice-types";

function attempt(
  overrides: Partial<PracticeAttemptView> & Pick<PracticeAttemptView, "promptId" | "userId">
): PracticeAttemptView {
  return {
    promptIndex: 1,
    displayName: "Học viên",
    answer: "I go to school.",
    isCorrect: true,
    score: 90,
    feedback: null,
    suggestion: null,
    updatedAt: "2026-08-02T01:00:00.000Z",
    ...overrides,
  };
}

describe("firstUnansweredIndex", () => {
  const promptIds = ["p1", "p2", "p3", "p4"];

  it("starts at the first prompt when nothing is answered", () => {
    expect(firstUnansweredIndex(promptIds, [])).toBe(0);
  });

  it("resumes at the first gap rather than restarting", () => {
    const answered = [
      attempt({ promptId: "p1", userId: "u1" }),
      attempt({ promptId: "p2", userId: "u1" }),
    ];
    expect(firstUnansweredIndex(promptIds, answered)).toBe(2);
  });

  it("skips over prompts answered out of order", () => {
    const answered = [
      attempt({ promptId: "p1", userId: "u1" }),
      attempt({ promptId: "p3", userId: "u1" }),
    ];
    expect(firstUnansweredIndex(promptIds, answered)).toBe(1);
  });

  it("lands on the last prompt once every prompt is answered", () => {
    const answered = promptIds.map((promptId) => attempt({ promptId, userId: "u1" }));
    expect(firstUnansweredIndex(promptIds, answered)).toBe(3);
  });

  it("does not go negative for an empty lesson", () => {
    expect(firstUnansweredIndex([], [])).toBe(0);
  });
});

describe("mergeAttempt", () => {
  it("replaces the same learner's previous answer for a prompt", () => {
    const existing = [
      attempt({ promptId: "p1", userId: "u1", score: 40, isCorrect: false }),
    ];
    const merged = mergeAttempt(
      existing,
      attempt({ promptId: "p1", userId: "u1", score: 95, isCorrect: true })
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].score).toBe(95);
    expect(merged[0].isCorrect).toBe(true);
  });

  it("keeps other learners' answers for the same prompt", () => {
    const existing = [attempt({ promptId: "p1", userId: "u1" })];
    const merged = mergeAttempt(existing, attempt({ promptId: "p1", userId: "u2" }));

    expect(merged).toHaveLength(2);
    expect(merged.map((a) => a.userId).sort()).toEqual(["u1", "u2"]);
  });

  it("orders results by prompt index", () => {
    const existing = [attempt({ promptId: "p3", userId: "u1", promptIndex: 3 })];
    const merged = mergeAttempt(
      existing,
      attempt({ promptId: "p1", userId: "u1", promptIndex: 1 })
    );

    expect(merged.map((a) => a.promptIndex)).toEqual([1, 3]);
  });
});

describe("buildLeaderboard", () => {
  it("returns nothing when nobody has practised", () => {
    expect(buildLeaderboard([])).toEqual([]);
  });

  it("rolls attempts up per learner", () => {
    const rows = buildLeaderboard([
      attempt({ promptId: "p1", userId: "u1", displayName: "Hoa", score: 100 }),
      attempt({
        promptId: "p2",
        userId: "u1",
        displayName: "Hoa",
        score: 60,
        isCorrect: false,
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "u1",
      displayName: "Hoa",
      answered: 2,
      correct: 1,
      averageScore: 80,
    });
  });

  it("ranks by correct answers, then average score", () => {
    const rows = buildLeaderboard([
      attempt({ promptId: "p1", userId: "u1", displayName: "Hoa", score: 80 }),
      attempt({ promptId: "p2", userId: "u1", displayName: "Hoa", score: 80 }),
      attempt({ promptId: "p1", userId: "u2", displayName: "Nam", score: 100 }),
      attempt({ promptId: "p1", userId: "u3", displayName: "Lan", score: 70 }),
    ]);

    expect(rows.map((r) => r.displayName)).toEqual(["Hoa", "Nam", "Lan"]);
  });

  it("tracks the most recent activity timestamp", () => {
    const rows = buildLeaderboard([
      attempt({
        promptId: "p1",
        userId: "u1",
        updatedAt: "2026-08-02T01:00:00.000Z",
      }),
      attempt({
        promptId: "p2",
        userId: "u1",
        updatedAt: "2026-08-02T03:00:00.000Z",
      }),
    ]);

    expect(rows[0].lastActiveAt).toBe("2026-08-02T03:00:00.000Z");
  });
});
