"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CatState } from "@prisma/client";
import { CatMood } from "@/lib/cat/compute-cat-mood";
import { CatSprite } from "./cat-sprite";
import { CatGameModal } from "./cat-game-modal";

interface CatApiResponse {
  catState: CatState;
  mood: CatMood;
  todayPoints: number;
  pointsBalance: number;
}

const MOOD_BADGES: Record<CatMood, { label: string; color: string }> = {
  happy: { label: "Vui vẻ", color: "bg-emerald-500 text-white" },
  playing: { label: "Đang chơi", color: "bg-indigo-500 text-white" },
  hungry: { label: "Đang đói!", color: "bg-amber-500 text-white animate-pulse" },
  dirty: { label: "Cần tắm!", color: "bg-sky-500 text-white" },
  sleeping: { label: "Zzz...", color: "bg-slate-600 text-white" },
  sad: { label: "Đang buồn", color: "bg-rose-500 text-white animate-pulse" },
};

export function CatWidget() {
  const pathname = usePathname();
  const [catData, setCatData] = useState<CatApiResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCatState = useCallback(async () => {
    try {
      const isOnLessonPage = pathname?.includes("/lesson/") ?? false;
      const res = await fetch(`/api/cat?isOnLessonPage=${isOnLessonPage}`);

      if (res.ok) {
        const data: CatApiResponse = await res.json();
        setCatData(data);
      }
    } catch (err) {
      console.error("Error fetching cat state:", err);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    fetchCatState();

    // Refetch every 60 seconds
    const interval = setInterval(fetchCatState, 60000);
    return () => clearInterval(interval);
  }, [fetchCatState]);

  if (loading && !catData) return null;
  if (!catData) return null;

  const { catState, mood } = catData;
  const badge = MOOD_BADGES[mood];

  return (
    <>
      {/* Floating Cat Widget (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center select-none group">
        {/* Mood Badge / Tooltip */}
        <div
          className={`mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md transition-transform duration-200 group-hover:scale-110 ${badge.color}`}
        >
          {badge.label}
        </div>

        {/* Floating Trigger Box */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative bg-white/90 backdrop-blur-md p-2 rounded-2xl border-2 border-slate-200/80 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center cursor-pointer"
          title="Bấm để mở Mini Game Nuôi Mèo Mochi"
        >
          <CatSprite mood={mood} size={70} />

          {/* Mini 3 Status Bars under Cat */}
          <div className="w-full flex gap-1 mt-1 px-1">
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${catState.happiness}%` }}
              />
            </div>
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${catState.hunger}%` }}
              />
            </div>
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${catState.cleanliness}%` }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Cat Mini-Game Modal */}
      <CatGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        catData={catData}
        onRefresh={fetchCatState}
      />
    </>
  );
}
