"use client";

import { Check, X } from "lucide-react";
import { initialOf } from "@/lib/classroom/display-name";
import type { PracticeAttemptView } from "@/lib/practice/practice-types";

interface PracticePromptNavigatorProps {
  promptIds: string[];
  currentIndex: number;
  currentUserId: string;
  ownAttempts: PracticeAttemptView[];
  classroomAttempts: PracticeAttemptView[];
  onJump: (index: number) => void;
}

/**
 * The strip of question chips above the exercise.
 *
 * Each chip shows the caller's own verdict plus small avatars for classmates
 * who have already answered that prompt — this is the "see who did what" view.
 */
export function PracticePromptNavigator({
  promptIds,
  currentIndex,
  currentUserId,
  ownAttempts,
  classroomAttempts,
  onJump,
}: PracticePromptNavigatorProps) {
  const ownByPrompt = new Map(ownAttempts.map((a) => [a.promptId, a]));

  const peersByPrompt = new Map<string, PracticeAttemptView[]>();
  for (const attempt of classroomAttempts) {
    if (attempt.userId === currentUserId) continue;
    const bucket = peersByPrompt.get(attempt.promptId);
    if (bucket) bucket.push(attempt);
    else peersByPrompt.set(attempt.promptId, [attempt]);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {promptIds.map((promptId, index) => {
        const own = ownByPrompt.get(promptId);
        const peers = peersByPrompt.get(promptId) ?? [];
        const isCurrent = index === currentIndex;

        const stateClass = own
          ? own.isCorrect
            ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-300"
            : "border-rose-500/50 bg-rose-950/50 text-rose-300"
          : "border-zinc-800 bg-zinc-900 text-zinc-400";

        return (
          <button
            key={promptId}
            type="button"
            onClick={() => onJump(index)}
            title={
              peers.length > 0
                ? `${peers.length} bạn đã làm câu này: ${peers
                    .map((p) => p.displayName)
                    .join(", ")}`
                : "Chưa có bạn nào làm câu này"
            }
            className={`relative flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all hover:scale-105 ${stateClass} ${
              isCurrent ? "ring-2 ring-blue-500/60 ring-offset-1 ring-offset-zinc-950" : ""
            }`}
          >
            <span>{index + 1}</span>

            {own &&
              (own.isCorrect ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              ))}

            {peers.length > 0 && (
              <span className="ml-0.5 flex -space-x-1.5">
                {peers.slice(0, 3).map((peer) => (
                  <span
                    key={peer.userId}
                    className={`w-4 h-4 rounded-full border text-[8px] font-bold flex items-center justify-center ${
                      peer.isCorrect
                        ? "bg-emerald-600 border-emerald-400 text-white"
                        : "bg-rose-600 border-rose-400 text-white"
                    }`}
                  >
                    {initialOf(peer.displayName)}
                  </span>
                ))}
                {peers.length > 3 && (
                  <span className="w-4 h-4 rounded-full border border-zinc-600 bg-zinc-800 text-[8px] font-bold text-zinc-300 flex items-center justify-center">
                    +{peers.length - 3}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
