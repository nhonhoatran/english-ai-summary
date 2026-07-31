"use client";

import React from "react";

interface StreakCalendarProps {
  history: Array<{ date: string; points: number }>;
}

export function StreakCalendar({ history }: StreakCalendarProps) {
  const getColorClass = (points: number) => {
    if (points <= 0) return "bg-zinc-900 border-zinc-800 text-zinc-600";
    if (points < 10) return "bg-emerald-950/80 border-emerald-800/60 text-emerald-400 font-medium";
    if (points < 20) return "bg-emerald-600/30 border-emerald-500/60 text-emerald-300 font-semibold";
    return "bg-emerald-500 border-emerald-400 text-zinc-950 font-bold shadow-sm shadow-emerald-500/30";
  };

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span>Lịch sử tích điểm (30 ngày qua)</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Ít</span>
          <div className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800" />
          <div className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-800/60" />
          <div className="w-3 h-3 rounded bg-emerald-600/30 border border-emerald-500/60" />
          <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
          <span>Nhiều</span>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
        {history.map((item) => (
          <div
            key={item.date}
            title={`${item.points} điểm ngày ${formatDateLabel(item.date)}`}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all hover:scale-105 cursor-pointer relative group ${getColorClass(
              item.points
            )}`}
          >
            <span className="text-[10px] opacity-70 font-mono">
              {formatDateLabel(item.date)}
            </span>
            <span className="text-xs tracking-tight">
              {item.points > 0 ? `+${item.points}` : "0"}
            </span>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 px-2 py-1 bg-zinc-900 text-zinc-100 text-[11px] rounded shadow-lg border border-zinc-700 whitespace-nowrap pointer-events-none">
              {item.points} điểm ngày {formatDateLabel(item.date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
