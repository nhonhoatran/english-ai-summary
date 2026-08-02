"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy, Crown } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { initialOf } from "@/lib/classroom/display-name";
import {
  buildLeaderboard,
  mergeAttempt,
  type PracticeAttemptEvent,
  type PracticeAttemptView,
} from "@/lib/practice/practice-types";

interface ClassroomLeaderboardProps {
  lessonId: string;
  initialAttempts: PracticeAttemptView[];
  totalPrompts: number;
  currentUserId: string;
}

const RANK_STYLES = [
  "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "bg-zinc-400/20 text-zinc-200 border-zinc-400/40",
  "bg-orange-700/20 text-orange-300 border-orange-700/40",
];

/**
 * Live standings for the current lesson.
 *
 * Subscribes to the socket directly rather than receiving attempts from the
 * practice tab, so the ranking keeps updating while the class is on any other
 * tab (the practice tab is not even the active panel most of the time).
 */
export function ClassroomLeaderboard({
  lessonId,
  initialAttempts,
  totalPrompts,
  currentUserId,
}: ClassroomLeaderboardProps) {
  const [attempts, setAttempts] = useState<PracticeAttemptView[]>(initialAttempts);
  const [seededFor, setSeededFor] = useState(lessonId);

  // Re-seed when the class switches lesson. Adjusting state during render is
  // React's recommended pattern here — an effect would render stale rows first.
  if (seededFor !== lessonId) {
    setSeededFor(lessonId);
    setAttempts(initialAttempts);
  }

  useEffect(() => {
    const socket = getSocket();

    const onAttempt = (payload: PracticeAttemptEvent) => {
      if (!payload?.attempt || payload.lessonId !== lessonId) return;
      setAttempts((prev) => mergeAttempt(prev, payload.attempt));
    };

    socket.on("practice-attempt", onAttempt);
    return () => {
      socket.off("practice-attempt", onAttempt);
    };
  }, [lessonId]);

  const rows = useMemo(() => buildLeaderboard(attempts), [attempts]);

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 space-y-3 shadow-xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-bold text-sm text-zinc-100">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span>Bảng xếp hạng luyện viết</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-5 text-center text-xs text-zinc-500">
          Chưa ai làm bài. Làm câu đầu tiên để lên bảng nghen!
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, index) => {
            const isMe = row.userId === currentUserId;
            return (
              <li
                key={row.userId}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 border transition-colors ${
                  isMe
                    ? "border-blue-500/40 bg-blue-950/30"
                    : "border-transparent bg-zinc-900/50"
                }`}
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-lg border flex items-center justify-center text-[11px] font-extrabold ${
                    RANK_STYLES[index] ??
                    "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {index === 0 ? <Crown className="w-3.5 h-3.5" /> : index + 1}
                </span>

                <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {initialOf(row.displayName)}
                </span>

                <span className="flex-1 min-w-0 text-xs font-semibold text-zinc-200 truncate">
                  {row.displayName}
                  {isMe && <span className="ml-1 text-blue-400">(bạn)</span>}
                </span>

                <span className="shrink-0 text-right leading-tight">
                  <span className="block text-xs font-bold text-emerald-400">
                    {row.correct}/{totalPrompts}
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    TB {row.averageScore}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
