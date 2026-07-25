// path/to/src/components/lesson/tab-dialogue.tsx
"use client";

import { useState, useMemo } from "react";
import { usePlayer } from "./lesson-player-provider";
import { formatTimestamp } from "@/lib/format-timestamp";
import { Play, Users, User, Eye, EyeOff } from "lucide-react";

interface Segment {
  id: string;
  orderIndex: number;
  startSeconds: number;
  speaker: string;
  text: string;
}

interface TabDialogueProps {
  segments: Segment[];
}

type RoleMode = "all" | "speakerA" | "speakerB";

export function TabDialogue({ segments }: TabDialogueProps) {
  const { seekTo } = usePlayer();
  const [roleMode, setRoleMode] = useState<RoleMode>("all");
  const [maskTargetLines, setMaskTargetLines] = useState<boolean>(false);
  const [revealedSegmentIds, setRevealedSegmentIds] = useState<Record<string, boolean>>({});
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Extract unique speakers (Speaker A = first speaker, Speaker B = second speaker)
  const speakers = useMemo(() => {
    const set = new Set<string>();
    segments.forEach((s) => {
      if (s.speaker && s.speaker.trim()) {
        set.add(s.speaker.trim());
      }
    });
    const list = Array.from(set);
    return {
      speakerA: list[0] || "Speaker A",
      speakerB: list[1] || "Speaker B",
    };
  }, [segments]);

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedSegmentIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLineClick = (seg: Segment) => {
    setActiveSegmentId(seg.id);
    seekTo(seg.startSeconds);
  };

  if (segments.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        No dialogue script available for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roleplay Controls Header */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Chế độ Giả lập Đối thoại (Dialogue Simulator)</span>
          </div>

          {/* Mask toggle for Roleplay mode */}
          {roleMode !== "all" && (
            <button
              type="button"
              onClick={() => setMaskTargetLines((prev) => !prev)}
              className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                maskTargetLines
                  ? "bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/50"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {maskTargetLines ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Che lời vai của bạn (Đang bật)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Che lời vai của bạn (Tắt)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950/80 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setRoleMode("all");
              setMaskTargetLines(false);
            }}
            className={`py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              roleMode === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nghe tất cả</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleMode("speakerA")}
            className={`py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              roleMode === "speakerA"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-900"
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-300" />
            <span className="truncate">Vai 1: {speakers.speakerA}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleMode("speakerB")}
            className={`py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              roleMode === "speakerB"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900"
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-300" />
            <span className="truncate">Vai 2: {speakers.speakerB}</span>
          </button>
        </div>

        {/* Dynamic Helper Prompt based on Mode */}
        <p className="text-xs text-zinc-400 italic">
          {roleMode === "all"
            ? "💡 Nhấn vào bất kỳ câu đối thoại nào để tua video đến lượt nói đó."
            : roleMode === "speakerA"
            ? `👤 Bạn đang đóng vai ${speakers.speakerA}. Luyện phát biểu lượt của bạn trước khi nghe mẫu!`
            : `👤 Bạn đang đóng vai ${speakers.speakerB}. Luyện phát biểu lượt của bạn trước khi nghe mẫu!`}
        </p>
      </div>

      {/* Dialogue Chat Bubbles Stream */}
      <div className="space-y-4">
        {segments.map((seg) => {
          const isSpeakerA = seg.speaker.trim() === speakers.speakerA;
          const isTargetUserRole =
            (roleMode === "speakerA" && isSpeakerA) ||
            (roleMode === "speakerB" && !isSpeakerA);

          const shouldMask =
            roleMode !== "all" &&
            isTargetUserRole &&
            maskTargetLines &&
            !revealedSegmentIds[seg.id];

          const isActive = activeSegmentId === seg.id;

          return (
            <div
              key={seg.id}
              onClick={() => handleLineClick(seg)}
              className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                isSpeakerA
                  ? "bg-blue-950/20 border-blue-900/40 hover:border-blue-700/60"
                  : "bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60"
              } ${
                isActive
                  ? "ring-2 ring-blue-500/80 shadow-lg shadow-blue-950/50"
                  : ""
              }`}
            >
              {/* Speaker Avatar Icon */}
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                  isSpeakerA
                    ? "bg-blue-900/80 text-blue-200 border border-blue-700/50"
                    : "bg-emerald-900/80 text-emerald-200 border border-emerald-700/50"
                }`}
              >
                {seg.speaker.slice(0, 2).toUpperCase()}
              </div>

              {/* Speech Content Card */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isSpeakerA ? "text-blue-400" : "text-emerald-400"
                      }`}
                    >
                      {seg.speaker}
                    </span>
                    {isTargetUserRole && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Lượt của bạn
                      </span>
                    )}
                  </div>

                  {/* Timestamp Play Button */}
                  <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Play className="w-3 h-3 fill-current opacity-70 group-hover:opacity-100" />
                    {formatTimestamp(seg.startSeconds)}
                  </span>
                </div>

                {/* Speech text or Masked Placeholder */}
                <div className="text-sm leading-relaxed text-zinc-100">
                  {shouldMask ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                      <span className="font-mono text-zinc-500 select-none tracking-widest">
                        •••••••• •••••••••••• •••••••
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleReveal(seg.id, e)}
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Hiện đáp án
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">
                      {seg.text}
                      {isTargetUserRole &&
                        maskTargetLines &&
                        revealedSegmentIds[seg.id] && (
                          <button
                            type="button"
                            onClick={(e) => toggleReveal(seg.id, e)}
                            className="ml-2 text-xs text-zinc-500 hover:text-zinc-300 underline"
                          >
                            (Ẩn lại)
                          </button>
                        )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
