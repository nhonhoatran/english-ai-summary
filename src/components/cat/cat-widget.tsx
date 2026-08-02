"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CatState } from "@prisma/client";
import { CatMood } from "@/lib/cat/compute-cat-mood";
import { CatSprite } from "./cat-sprite";
import { CatGameModal } from "./cat-game-modal";
import { playCatPop } from "@/lib/cat/cat-audio";

interface CatApiResponse {
  catState: CatState;
  mood: CatMood;
  todayPoints: number;
  pointsBalance: number;
}

const MOOD_BADGES: Record<CatMood, { label: string; color: string }> = {
  happy: { label: "Vui vẻ 💕", color: "bg-emerald-500 text-white shadow-emerald-200" },
  playing: { label: "Đang chơi 🧶", color: "bg-indigo-500 text-white shadow-indigo-200" },
  hungry: { label: "Đang đói! 🐟", color: "bg-amber-500 text-white animate-pulse shadow-amber-200" },
  dirty: { label: "Cần tắm! 🧼", color: "bg-sky-500 text-white shadow-sky-200" },
  sleeping: { label: "Zzz... 💤", color: "bg-slate-600 text-white shadow-slate-200" },
  sad: { label: "Đang buồn 🥺", color: "bg-rose-500 text-white animate-pulse shadow-rose-200" },
};

export function CatWidget() {
  const pathname = usePathname();
  const [catData, setCatData] = useState<CatApiResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // If on login page, do not render cat widget at all
  const isLoginPage = pathname === "/login";

  const fetchCatState = useCallback(async () => {
    try {
      const isOnLessonPage = pathname?.includes("/lessons/") ?? false;
      const res = await fetch(`/api/cat?isOnLessonPage=${isOnLessonPage}`);

      if (res.ok) {
        const data: CatApiResponse = await res.json();
        setCatData(data);
      } else {
        setCatData(null);
      }
    } catch (err) {
      console.error("Error fetching cat state:", err);
      setCatData(null);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Skip entirely on the login page — the component renders null there.
    if (isLoginPage) return;

    // Not hoistable to the server: the cat's mood depends on the current route
    // (isOnLessonPage), so it has to be re-fetched on every navigation as well
    // as on the 60s poll. The root layout does not re-render on navigation, so
    // passing initial data down from the server would freeze the mood.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route-driven polling, see note above
    fetchCatState();

    const interval = setInterval(fetchCatState, 60000);
    return () => clearInterval(interval);
  }, [fetchCatState, isLoginPage]);

  if (isLoginPage || (loading && !catData) || !catData) {
    return null;
  }

  const { catState, mood } = catData;
  const badge = MOOD_BADGES[mood];

  const handleOpenModal = () => {
    playCatPop();
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Floating Cat Widget (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center select-none group animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mood Badge / Tooltip */}
        <div
          className={`mb-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold shadow-md transition-all duration-300 group-hover:scale-110 flex items-center gap-1 ${badge.color}`}
        >
          <span>{badge.label}</span>
        </div>

        {/* Floating Trigger Box */}
        <button
          onClick={handleOpenModal}
          className="relative bg-white/95 backdrop-blur-md p-2.5 rounded-3xl border-2 border-amber-200/80 shadow-xl hover:shadow-2xl hover:border-amber-400 transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center cursor-pointer overflow-visible"
          title="Bấm để tương tác & mở Mini Game Nuôi Mèo Mochi"
        >
          <CatSprite mood={mood} size={76} interactive={true} />

          {/* Mini 3 Status Bars under Cat */}
          <div className="w-full flex gap-1 mt-1 px-1">
            {/* Happiness */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-pink-100">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${catState.happiness}%` }}
              />
            </div>
            {/* Hunger */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-amber-100">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${catState.hunger}%` }}
              />
            </div>
            {/* Cleanliness */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-sky-100">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
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
