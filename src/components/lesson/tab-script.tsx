// path/to/src/components/lesson/tab-script.tsx
"use client";

import { usePlayer } from "./lesson-player-provider";
import { formatTimestamp } from "@/lib/format-timestamp";
import { Play } from "lucide-react";

interface Segment {
  id: string;
  orderIndex: number;
  startSeconds: number;
  speaker: string;
  text: string;
}

interface TabScriptProps {
  segments: Segment[];
}

export function TabScript({ segments }: TabScriptProps) {
  const { seekTo } = usePlayer();

  if (segments.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        No script available for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((seg) => (
        <button
          key={seg.id}
          type="button"
          onClick={() => seekTo(seg.startSeconds)}
          className="w-full text-left p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:bg-zinc-800/90 hover:border-zinc-700 transition-all group flex items-start gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-zinc-800 group-hover:bg-blue-600 group-hover:text-white text-zinc-400 transition-colors">
            <Play className="w-3 h-3 fill-current opacity-70 group-hover:opacity-100" />
            {formatTimestamp(seg.startSeconds)}
          </span>
          <div className="flex-1 min-w-0 text-sm leading-relaxed">
            <span className="font-semibold text-blue-400 group-hover:text-blue-300">
              {seg.speaker}:
            </span>{" "}
            <span className="text-zinc-200">{seg.text}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
