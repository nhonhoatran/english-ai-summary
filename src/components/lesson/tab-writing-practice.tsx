"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PracticePromptNavigator } from "@/components/practice/practice-prompt-navigator";
import { PracticePeerAnswers } from "@/components/practice/practice-peer-answers";
import { PracticeResultCard } from "@/components/practice/practice-result-card";
import { PracticeSummaryCard } from "@/components/practice/practice-summary-card";
import { usePracticeRealtime } from "@/lib/practice/use-practice-realtime";
import {
  firstUnansweredIndex,
  type PracticeAttemptView,
} from "@/lib/practice/practice-types";
import {
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  PenLine,
  Trophy,
} from "lucide-react";

export interface WritingPromptClientData {
  id: string;
  orderIndex: number;
  viMeaning: string;
}

interface TabWritingPracticeProps {
  prompts: WritingPromptClientData[];
  lessonId: string;
  targetLanguage?: "english" | "chinese";
  currentUserId: string;
  /** Classroom code when practising inside a class, null for solo lessons. */
  classroomCode?: string | null;
  initialOwnAttempts?: PracticeAttemptView[];
  initialClassroomAttempts?: PracticeAttemptView[];
}

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "error"; message: string };

export function TabWritingPractice({
  prompts,
  lessonId,
  targetLanguage = "english",
  currentUserId,
  classroomCode = null,
  initialOwnAttempts = [],
  initialClassroomAttempts = [],
}: TabWritingPracticeProps) {
  const promptIds = useMemo(() => prompts.map((p) => p.id), [prompts]);

  const { ownAttempts, classroomAttempts, recordOwnAttempt } =
    usePracticeRealtime({
      lessonId,
      classroomCode,
      initialOwnAttempts,
      initialClassroomAttempts,
    });

  // Resume where the learner stopped instead of always restarting at prompt 1.
  const [currentIndex, setCurrentIndex] = useState(() =>
    firstUnansweredIndex(promptIds, initialOwnAttempts)
  );
  const [draft, setDraft] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ status: "idle" });
  const [showSummary, setShowSummary] = useState(false);

  const ownByPrompt = useMemo(
    () => new Map(ownAttempts.map((a) => [a.promptId, a])),
    [ownAttempts]
  );

  if (!prompts || prompts.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
        <PenLine className="w-8 h-8 text-zinc-500 mx-auto" />
        <h3 className="text-lg font-semibold text-zinc-300">Chưa có bài luyện viết</h3>
        <p className="text-sm text-zinc-500">
          Bài học này chưa được tạo câu luyện viết nào.
        </p>
      </div>
    );
  }

  const totalPrompts = prompts.length;
  const currentPrompt = prompts[currentIndex];
  const currentAttempt = ownByPrompt.get(currentPrompt.id) ?? null;

  // Progress counts prompts actually answered — the old bar tracked the cursor,
  // so jumping back to prompt 1 made a finished session read as 5%.
  const answeredCount = ownAttempts.filter((a) =>
    promptIds.includes(a.promptId)
  ).length;
  const progressPercent = Math.round((answeredCount / totalPrompts) * 100);
  const correctCount = ownAttempts.filter(
    (a) => promptIds.includes(a.promptId) && a.isCorrect
  ).length;
  const allAnswered = answeredCount >= totalPrompts;

  const peersForPrompt = classroomAttempts.filter(
    (a) => a.promptId === currentPrompt.id && a.userId !== currentUserId
  );

  const handleCheck = async () => {
    if (!draft.trim() || checkState.status === "checking") return;
    setCheckState({ status: "checking" });

    try {
      const res = await fetch("/api/check-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: currentPrompt.id,
          userAnswer: draft.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không chấm được câu này, thử lại nghen.");
      }

      const result = await res.json();

      recordOwnAttempt({
        promptId: currentPrompt.id,
        promptIndex: currentPrompt.orderIndex,
        userId: currentUserId,
        displayName: "Bạn",
        answer: draft.trim(),
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback ?? null,
        suggestion: result.suggestion ?? null,
        updatedAt: new Date().toISOString(),
      });

      setCheckState({ status: "idle" });
      setDraft("");

      if (result.isCorrect) {
        fetch("/api/points/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "writing_correct",
            meta: { promptId: currentPrompt.id },
          }),
        }).catch((err) => console.error("Failed to award writing points:", err));
      }
    } catch (err: unknown) {
      setCheckState({
        status: "error",
        message: err instanceof Error ? err.message : "Có lỗi xảy ra.",
      });
    }
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= totalPrompts) return;
    setCurrentIndex(index);
    setDraft("");
    setCheckState({ status: "idle" });
    setShowSummary(false);
  };

  const handleRetry = () => {
    setDraft(currentAttempt?.answer ?? "");
    setCheckState({ status: "idle" });
  };

  if (showSummary) {
    const avgScore =
      answeredCount > 0
        ? Math.round(
            ownAttempts
              .filter((a) => promptIds.includes(a.promptId))
              .reduce((sum, a) => sum + a.score, 0) / answeredCount
          )
        : 0;

    return (
      <PracticeSummaryCard
        answeredCount={answeredCount}
        totalPrompts={totalPrompts}
        correctCount={correctCount}
        averageScore={avgScore}
        onResume={() => goTo(firstUnansweredIndex(promptIds, ownAttempts))}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Progress — driven by answered count, not the cursor position */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">
            Câu {currentIndex + 1} / {totalPrompts}
          </span>
          <span>
            Đã làm {answeredCount}/{totalPrompts} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <PracticePromptNavigator
        promptIds={promptIds}
        currentIndex={currentIndex}
        currentUserId={currentUserId}
        ownAttempts={ownAttempts}
        classroomAttempts={classroomAttempts}
        onJump={goTo}
      />

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5 shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {targetLanguage === "chinese" ? "Dịch sang tiếng Trung" : "Dịch sang tiếng Anh"}
          </span>
          <p className="text-lg sm:text-xl font-medium text-white leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            {currentPrompt.viMeaning}
          </p>
        </div>

        {currentAttempt ? (
          <div className="space-y-4">
            <PracticeResultCard attempt={currentAttempt} />

            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 gap-2 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại câu này
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={checkState.status === "checking"}
              placeholder={
                targetLanguage === "chinese"
                  ? "Gõ câu tiếng Trung của bạn ở đây..."
                  : "Gõ câu tiếng Anh của bạn ở đây..."
              }
              rows={3}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-base disabled:opacity-60 resize-none transition-all"
            />

            <Button
              onClick={handleCheck}
              disabled={!draft.trim() || checkState.status === "checking"}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl gap-2 transition-all disabled:opacity-50"
            >
              {checkState.status === "checking" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chấm bằng AI...
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4" />
                  Check Answer
                </>
              )}
            </Button>
          </div>
        )}

        {checkState.status === "error" && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            {checkState.message}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl gap-1.5 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Câu trước
          </Button>

          {currentIndex < totalPrompts - 1 ? (
            <Button
              onClick={() => goTo(currentIndex + 1)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl gap-1.5"
            >
              Câu sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowSummary(true)}
              disabled={!allAnswered}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-1.5 disabled:opacity-40"
              title={allAnswered ? undefined : "Làm hết các câu đã rồi xem kết quả nghen"}
            >
              Xem kết quả
              <Trophy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {classroomCode && (
        <PracticePeerAnswers peers={peersForPrompt} unlocked={!!currentAttempt} />
      )}
    </div>
  );
}
