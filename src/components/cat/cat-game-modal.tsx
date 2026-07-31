"use client";

import React, { useState } from "react";
import { CatState } from "@prisma/client";
import { CatMood } from "@/lib/cat/compute-cat-mood";
import { CatSprite } from "./cat-sprite";

interface CatGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  catData: {
    catState: CatState;
    mood: CatMood;
    todayPoints: number;
    pointsBalance: number;
  } | null;
  onRefresh: () => void;
}

const SPEECH_BUBBLES: Record<CatMood, string> = {
  happy: "Meow~ Mochi vui quá chừng! Anh học giỏi ghê nè! 💕",
  playing: "Nhảy nhót thôi! Chơi với Mochi tiếp hông anh? 🧶",
  hungry: "Bụng kêu rột rột rồi... Cho Mochi ăn xíu đi anh! 🍗",
  dirty: "Hơi ngứa ngáy bẩn bẩn rồi... Tắm rửa cho Mochi nha! 🧼",
  sleeping: "Khò khò... Mochi buồn ngủ quá zzz... 💤",
  sad: "Mochi hơi buồn đó... Anh nhớ học bài đều nghen! 🥺",
};

const MOOD_NAMES: Record<CatMood, string> = {
  happy: "Vui vẻ",
  playing: "Hăng hái",
  hungry: "Đang đói",
  dirty: "Cần tắm",
  sleeping: "Đang ngủ",
  sad: "Đang buồn",
};

export function CatGameModal({
  isOpen,
  onClose,
  catData,
  onRefresh,
}: CatGameModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !catData) return null;

  const { catState, mood, pointsBalance } = catData;

  const handleAction = async (actionPath: string, actionName: string) => {
    try {
      setLoadingAction(actionName);
      setFeedbackMsg(null);
      setErrorMsg(null);

      const res = await fetch(`/api/cat/${actionPath}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      setFeedbackMsg(data.message || "Thao tác thành công!");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể thực hiện thao tác");
    } finally {
      setLoadingAction(null);
    }
  };

  const remainingPets = Math.max(0, 3 - (catState.petCount ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Title & Points Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
            🐾 Mèo Mochi • <span className="text-slate-600">{MOOD_NAMES[mood]}</span>
          </div>
          <div className="mt-2 text-sm text-slate-600 font-medium">
            Điểm tích lũy: <span className="font-bold text-amber-600">{pointsBalance} pts</span>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="relative bg-slate-800 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-bl-none shadow-md max-w-[85%] text-center mb-4 border border-slate-700 animate-bounce">
          {SPEECH_BUBBLES[mood]}
          <div className="absolute -bottom-2 left-4 w-3 h-3 bg-slate-800 transform rotate-45" />
        </div>

        {/* Cat Visual Preview */}
        <div className="my-2 p-4 bg-gradient-to-b from-amber-50/50 to-orange-50/30 rounded-2xl w-full flex justify-center items-center border border-amber-100/60">
          <CatSprite mood={mood} size={180} />
        </div>

        {/* Status Bars */}
        <div className="w-full space-y-2.5 my-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {/* Happiness */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>❤️ Vui vẻ</span>
              <span>{catState.happiness}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500 rounded-full"
                style={{ width: `${catState.happiness}%` }}
              />
            </div>
          </div>

          {/* Hunger */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>🍗 Cơn đói</span>
              <span>{catState.hunger}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${catState.hunger}%` }}
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>🧼 Sạch sẽ</span>
              <span>{catState.cleanliness}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${catState.cleanliness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback / Error Toast */}
        {feedbackMsg && (
          <div className="w-full text-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl mb-3 animate-in fade-in">
            {feedbackMsg}
          </div>
        )}
        {errorMsg && (
          <div className="w-full text-center text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl mb-3 animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Feed */}
          <button
            onClick={() => handleAction("feed", "feed")}
            disabled={loadingAction !== null || pointsBalance < 5}
            className="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl">🍲</span>
            <span className="text-xs font-bold text-slate-800 mt-1">Cho ăn</span>
            <span className="text-[10px] text-amber-700 font-medium">-5 pts</span>
          </button>

          {/* Bath */}
          <button
            onClick={() => handleAction("bath", "bath")}
            disabled={loadingAction !== null || pointsBalance < 10}
            className="flex flex-col items-center justify-center p-3 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed border border-sky-200 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl">🧼</span>
            <span className="text-xs font-bold text-slate-800 mt-1">Tắm rửa</span>
            <span className="text-[10px] text-sky-700 font-medium">-10 pts</span>
          </button>

          {/* Pet */}
          <button
            onClick={() => handleAction("pet", "pet")}
            disabled={loadingAction !== null || remainingPets <= 0}
            className="flex flex-col items-center justify-center p-3 bg-pink-50 hover:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed border border-pink-200 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl">👋</span>
            <span className="text-xs font-bold text-slate-800 mt-1">Vuốt ve</span>
            <span className="text-[10px] text-pink-700 font-medium">
              Free ({remainingPets}/3 lượt)
            </span>
          </button>

          {/* Play */}
          <button
            onClick={() => handleAction("play", "play")}
            disabled={loadingAction !== null || pointsBalance < 15}
            className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl">🧶</span>
            <span className="text-xs font-bold text-slate-800 mt-1">Chơi đùa</span>
            <span className="text-[10px] text-indigo-700 font-medium">-15 pts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
