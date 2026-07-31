"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
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
}

type CheckResult = {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestion?: string;
};

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "result"; result: CheckResult }
  | { status: "error"; message: string };

export function TabWritingPractice({ prompts, targetLanguage = "english" }: TabWritingPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ status: "idle" });
  const [scores, setScores] = useState<Record<number, CheckResult>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (!prompts || prompts.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
        <PenLine className="w-8 h-8 text-zinc-500 mx-auto" />
        <h3 className="text-lg font-semibold text-zinc-300">No Writing Prompts</h3>
        <p className="text-sm text-zinc-500">
          This lesson doesn&apos;t have any writing exercises yet.
        </p>
      </div>
    );
  }

  const currentPrompt = prompts[currentIndex];
  const totalPrompts = prompts.length;

  const handleCheck = async () => {
    if (!userAnswer.trim() || checkState.status === "checking") return;

    setCheckState({ status: "checking" });

    try {
      const res = await fetch("/api/check-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: currentPrompt.id,
          userAnswer: userAnswer.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to evaluate your sentence.");
      }

      const result: CheckResult = await res.json();
      setCheckState({ status: "result", result });
      setScores((prev) => ({ ...prev, [currentIndex]: result }));

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
    } catch (err: any) {
      setCheckState({
        status: "error",
        message: err.message || "An unexpected error occurred.",
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalPrompts - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setCheckState({ status: "idle" });
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setCheckState({ status: "idle" });
    setScores({});
    setIsCompleted(false);
  };

  if (isCompleted) {
    const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = totalPrompts > 0 ? Math.round(totalScore / totalPrompts) : 0;
    const correctCount = Object.values(scores).filter((s) => s.isCorrect).length;

    return (
      <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-6 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Practice Complete!</h2>
          <p className="text-zinc-400 text-sm">
            You completed all {totalPrompts} writing exercises in this lesson.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Average Score
            </span>
            <div className="text-3xl font-extrabold text-emerald-400">{avgScore}/100</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Passed Prompts
            </span>
            <div className="text-3xl font-extrabold text-blue-400">
              {correctCount}/{totalPrompts}
            </div>
          </div>
        </div>

        <Button
          onClick={handleRestart}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Practice Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header / Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">
            Prompt {currentIndex + 1} of {totalPrompts}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalPrompts) * 100)}% Completed</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalPrompts) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Exercise Card */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-xl">
        {/* Vietnamese Meaning Prompt */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {targetLanguage === "chinese" ? "Translate to Chinese" : "Translate to English"}
          </span>
          <p className="text-lg sm:text-xl font-medium text-white leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            {currentPrompt.viMeaning}
          </p>
        </div>

        {/* Input Textarea */}
        <div className="space-y-3">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={checkState.status === "checking" || checkState.status === "result"}
            placeholder={
              targetLanguage === "chinese"
                ? "Type your Chinese translation here..."
                : "Type your English translation here..."
            }
            rows={3}
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-base disabled:opacity-60 resize-none transition-all"
          />

          {checkState.status === "idle" && (
            <Button
              onClick={handleCheck}
              disabled={!userAnswer.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl gap-2 transition-all disabled:opacity-50"
            >
              <PenLine className="w-4 h-4" />
              Check Answer
            </Button>
          )}

          {checkState.status === "checking" && (
            <Button disabled className="w-full bg-blue-600/50 text-white font-medium py-3 rounded-xl gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Evaluating with AI...
            </Button>
          )}
        </div>

        {/* Error Feedback */}
        {checkState.status === "error" && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <XCircle className="w-4 h-4 text-rose-400" />
              {checkState.message}
            </div>
            <Button
              onClick={handleCheck}
              variant="outline"
              size="sm"
              className="border-rose-800/80 text-rose-200 hover:bg-rose-900/40"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Evaluation Result */}
        {checkState.status === "result" && (
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            {checkState.result.isCorrect ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Correct!
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Score: {checkState.result.score}/100
                  </span>
                </div>
                <p className="text-sm text-emerald-200/90 leading-relaxed">
                  {checkState.result.feedback}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-rose-400 text-base">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    Needs Improvement
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Score: {checkState.result.score}/100
                  </span>
                </div>
                <p className="text-sm text-rose-200/90 leading-relaxed">
                  {checkState.result.feedback}
                </p>
                {checkState.result.suggestion && (
                  <div className="pt-2 border-t border-rose-900/50 space-y-1">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Suggested Answer:
                    </span>
                    <p className="text-sm font-medium text-white bg-zinc-950/70 p-3 rounded-lg border border-rose-900/40">
                      {checkState.result.suggestion}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleNext}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl gap-2 transition-all"
            >
              {currentIndex < totalPrompts - 1 ? (
                <>
                  Next Exercise
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  View Final Results
                  <Trophy className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
