"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Flame, Coins, Trophy, X, Zap, RefreshCw } from "lucide-react";
import { StreakCalendar } from "./streak-calendar";
import { useIsMounted } from "@/lib/react/use-is-mounted";
import type { TodayPointsSummary } from "@/lib/points/get-today-points-summary";

interface HistoryItem {
  date: string;
  points: number;
}

interface PointsWidgetProps {
  /**
   * Rendered by a server component, which already has the data — passing it in
   * removes the on-mount fetch waterfall (and the setState-inside-effect it
   * required). Refreshes after that happen from event handlers.
   */
  initialData: TodayPointsSummary;
}

export function PointsWidget({ initialData }: PointsWidgetProps) {
  const [data, setData] = useState<TodayPointsSummary>(initialData);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const mounted = useIsMounted();

  const refreshToday = useCallback(async () => {
    try {
      const res = await fetch("/api/points/today");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to refresh today points", err);
    }
  }, []);

  // Keyboard Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpenDrawer = async () => {
    setIsOpen(true);
    setLoadingHistory(true);
    // Opening the drawer is also the natural moment to pick up points earned
    // since the page was rendered.
    void refreshToday();
    try {
      const res = await fetch("/api/points/history");
      if (res.ok) {
        const json = await res.json();
        setHistory(json.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getMultiplier = (streak: number) => {
    if (streak >= 30) return 3;
    if (streak >= 7) return 2;
    return 1;
  };

  // No loading skeleton needed: the server supplies the initial data.
  const multiplier = getMultiplier(data.currentStreak);

  const modalContent = isOpen ? (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 grid place-items-center min-h-full animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-950 p-5 sm:p-6 border border-zinc-800 shadow-2xl space-y-5 relative rounded-2xl text-zinc-100 font-sans text-left my-auto"
      >
        {/* Close Button Top Right */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer border border-zinc-700/60"
          aria-label="Đóng"
          title="Đóng cửa sổ"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                Streak & Điểm Thưởng
              </h3>
              <p className="text-xs text-zinc-400">
                Học đều đặn mỗi ngày để duy trì chuỗi và nhân đôi điểm!
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Hôm nay
            </div>
            <div className="text-base sm:text-lg font-extrabold text-amber-300">
              +{data.totalToday} pts
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Chuỗi
            </div>
            <div className="text-base sm:text-lg font-extrabold text-orange-400 flex items-center gap-1">
              {data.currentStreak}d
              {multiplier > 1 && (
                <span className="text-xs text-amber-300 font-normal">
                  (x{multiplier})
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Kỷ kỷ lục
            </div>
            <div className="text-base sm:text-lg font-extrabold text-yellow-300">
              {data.longestStreak}d
            </div>
          </div>
        </div>

        {/* Multiplier Info */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-orange-950/40 to-amber-950/40 border border-orange-500/30 text-xs text-zinc-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Streak <strong>7 ngày</strong> nhận x2 điểm, <strong>30 ngày</strong> nhận x3 điểm thưởng!
          </span>
        </div>

        {/* Heatmap Calendar */}
        {loadingHistory ? (
          <div className="py-8 flex items-center justify-center text-zinc-500 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            Đang tải lịch sử...
          </div>
        ) : (
          <StreakCalendar history={history} />
        )}

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Header Pill Button */}
      <button
        onClick={handleOpenDrawer}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 hover:border-amber-500/60 text-xs font-semibold text-zinc-200 transition-all hover:scale-[1.03] active:scale-95 shadow-md group cursor-pointer"
      >
        {/* Points indicator */}
        <div className="flex items-center gap-1 text-amber-400">
          <Coins className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>{data.totalToday} pts</span>
        </div>

        <span className="text-zinc-600">•</span>

        {/* Streak indicator */}
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 animate-pulse" />
          <span>{data.currentStreak}d</span>
          {multiplier > 1 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] text-orange-300 font-bold">
              x{multiplier}
            </span>
          )}
        </div>
      </button>

      {/* Render Modal into document.body using React Portal */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
