"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Users, Lock } from "lucide-react";
import { initialOf } from "@/lib/classroom/display-name";
import type { PracticeAttemptView } from "@/lib/practice/practice-types";

interface PracticePeerAnswersProps {
  peers: PracticeAttemptView[];
  /** Peers' answers stay hidden until the viewer has answered themselves. */
  unlocked: boolean;
}

/**
 * Classmates' answers for the prompt currently on screen.
 *
 * Answers are gated behind the viewer having submitted their own — otherwise
 * the panel is just a copy-paste source and the exercise stops teaching.
 */
export function PracticePeerAnswers({ peers, unlocked }: PracticePeerAnswersProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (peers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
        <Users className="w-3.5 h-3.5" />
        <span>Chưa có bạn nào làm câu này.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800/80">
      <div className="px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-300">
        <Users className="w-3.5 h-3.5 text-blue-400" />
        <span>{peers.length} bạn đã làm câu này</span>
        {!unlocked && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <Lock className="w-3 h-3" />
            Làm xong mới xem được
          </span>
        )}
      </div>

      {peers.map((peer) => {
        const isOpen = expanded === peer.userId;
        return (
          <div key={peer.userId} className="px-4 py-2.5">
            <button
              type="button"
              onClick={() =>
                unlocked && setExpanded(isOpen ? null : peer.userId)
              }
              disabled={!unlocked}
              className="w-full flex items-center gap-2.5 text-left disabled:cursor-not-allowed"
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  peer.isCorrect ? "bg-emerald-600" : "bg-rose-600"
                }`}
              >
                {initialOf(peer.displayName)}
              </span>

              <span className="flex-1 min-w-0 text-xs font-semibold text-zinc-200 truncate">
                {peer.displayName}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  peer.isCorrect
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {peer.isCorrect ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {peer.score}
              </span>

              {unlocked &&
                (isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                ))}
            </button>

            {unlocked && isOpen && (
              <div className="mt-2 ml-[34px] space-y-1.5">
                <p className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 leading-relaxed">
                  {peer.answer}
                </p>
                {peer.feedback && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {peer.feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
