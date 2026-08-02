"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { PracticeAttemptView } from "@/lib/practice/practice-types";

interface PracticeResultCardProps {
  attempt: PracticeAttemptView;
}

/** The graded verdict for the learner's own stored answer. */
export function PracticeResultCard({ attempt }: PracticeResultCardProps) {
  return (
    <div
      className={`p-4 rounded-xl space-y-3 border ${
        attempt.isCorrect
          ? "bg-emerald-950/40 border-emerald-800/60"
          : "bg-rose-950/40 border-rose-800/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 font-semibold text-base ${
            attempt.isCorrect ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {attempt.isCorrect ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {attempt.isCorrect ? "Câu trả lời đúng!" : "Cần cải thiện"}
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white">
          {attempt.score}/100
        </span>
      </div>

      <p className="text-sm text-white/90 bg-zinc-950/60 px-3 py-2 rounded-lg border border-white/10">
        {attempt.answer}
      </p>

      {attempt.feedback && (
        <p className="text-sm text-white/80 leading-relaxed">{attempt.feedback}</p>
      )}

      {attempt.suggestion && (
        <div className="pt-2 border-t border-white/10 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Gợi ý câu đúng:
          </span>
          <p className="text-sm font-medium text-white bg-zinc-950/70 p-3 rounded-lg border border-white/10">
            {attempt.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}
