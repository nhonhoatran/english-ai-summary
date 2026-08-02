"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, LogIn, LogOut } from "lucide-react";
import { getSocket } from "@/lib/socket";
import type { PracticeAttemptEvent } from "@/lib/practice/practice-types";

interface FeedItem {
  id: string;
  kind: "correct" | "wrong" | "joined" | "left";
  text: string;
  at: string;
}

interface ClassroomActivityFeedProps {
  code: string;
  currentUserId: string;
}

const MAX_ITEMS = 30;

const ICONS = {
  correct: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  wrong: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  joined: <LogIn className="w-3.5 h-3.5 text-blue-400" />,
  left: <LogOut className="w-3.5 h-3.5 text-zinc-500" />,
};

/**
 * Rolling feed of what the class is doing right now. Deliberately in-memory
 * only — it is ambient awareness, not a record, so history is not persisted.
 */
export function ClassroomActivityFeed({
  code,
  currentUserId,
}: ClassroomActivityFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const socket = getSocket();
    let seq = 0;

    const push = (kind: FeedItem["kind"], text: string) => {
      seq += 1;
      const item: FeedItem = {
        id: `${Date.now()}-${seq}`,
        kind,
        text,
        at: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
    };

    const onAttempt = (payload: PracticeAttemptEvent) => {
      const attempt = payload?.attempt;
      if (!attempt) return;
      const who =
        attempt.userId === currentUserId ? "Bạn" : attempt.displayName;
      const questionNo = attempt.promptIndex;
      push(
        attempt.isCorrect ? "correct" : "wrong",
        attempt.isCorrect
          ? `${who} làm đúng câu ${questionNo} (${attempt.score} điểm)`
          : `${who} làm chưa đúng câu ${questionNo}`
      );
    };

    const onJoined = (payload: { displayName?: string }) => {
      if (!payload?.displayName) return;
      push("joined", `${payload.displayName} vào lớp`);
    };

    const onLeft = (payload: { displayName?: string }) => {
      if (!payload?.displayName) return;
      push("left", `${payload.displayName} rời lớp`);
    };

    socket.on("practice-attempt", onAttempt);
    socket.on("member-joined", onJoined);
    socket.on("member-left", onLeft);

    return () => {
      socket.off("practice-attempt", onAttempt);
      socket.off("member-joined", onJoined);
      socket.off("member-left", onLeft);
    };
  }, [code, currentUserId]);

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 space-y-3 shadow-xl">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 font-bold text-sm text-zinc-100">
        <Activity className="w-4 h-4 text-emerald-400" />
        <span>Hoạt động của lớp</span>
      </div>

      {items.length === 0 ? (
        <p className="py-5 text-center text-xs text-zinc-500">
          Chưa có hoạt động nào. Cả lớp làm bài là hiện ở đây liền.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-lg bg-zinc-900/50 px-2.5 py-1.5 text-xs animate-fade-in"
            >
              <span className="mt-0.5 shrink-0">{ICONS[item.kind]}</span>
              <span className="flex-1 min-w-0 text-zinc-300 leading-snug">
                {item.text}
              </span>
              <span className="shrink-0 text-[10px] text-zinc-600 tabular-nums">
                {item.at}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
