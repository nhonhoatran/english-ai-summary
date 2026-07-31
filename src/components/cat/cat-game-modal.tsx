"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CatState } from "@prisma/client";
import { CatMood } from "@/lib/cat/compute-cat-mood";
import { CatSprite, CatActionType } from "./cat-sprite";
import {
  playCatPop,
  playCatMeow,
  toggleCatMute,
  isCatMuted,
} from "@/lib/cat/cat-audio";

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

const SPEECH_BUBBLES: Record<CatMood, string[]> = {
  happy: [
    "Meow~ Mochi vui quá chừng! Anh học giỏi ghê nè! 💕",
    "Thương anh yêu nhiều lắm luôn á! ✨",
    "Ngoan ngoãn cùng anh học bài nào! 🐾",
  ],
  playing: [
    "Nhảy nhót thôi! Chơi với Mochi tiếp hông anh? 🧶",
    "Vèo vèo~ Mochi năng động quá trời nè! ⚡",
    "Tóm lấy cuộn len nào! Hahaha! 🎪",
  ],
  hungry: [
    "Bụng kêu rột rột rồi... Cho Mochi ăn xíu đi anh! 🍗",
    "Đói lả người rồi nè anh ơi... 🐟",
    "Cho Mochi xin miếng đồ ăn ngon lành đi ha! 😋",
  ],
  dirty: [
    "Hơi ngứa ngáy bẩn bẩn rồi... Tắm rửa cho Mochi nha! 🧼",
    "Xà bông thơm phức thích lắm luôn á anh! 🫧",
    "Tắm rửa sạch sẽ rồi mình cùng học tiếp nghen! 💧",
  ],
  sleeping: [
    "Khò khò... Mochi buồn ngủ quá zzz... 💤",
    "Đừng phá giấc ngủ của Mochi nghen... 😴",
    "Mơ thấy anh tặng cả đống cá ngừ nè... 🐟💤",
  ],
  sad: [
    "Mochi hơi buồn đó... Anh nhớ học bài đều nghen! 🥺",
    "Hông có ai chơi cùng Mochi hết á... 💔",
    "Anh ơi, xoa đầu Mochi chút đi cho đỡ buồn... 🐾",
  ],
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
  const [actionState, setActionState] = useState<CatActionType>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(isCatMuted());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !catData) return null;

  const { catState, mood, pointsBalance } = catData;

  const handleAction = async (actionPath: string, actionName: CatActionType) => {
    playCatPop();
    try {
      setLoadingAction(actionPath);
      setActionState(actionName);
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

  const handleToggleSound = () => {
    const isNowMuted = toggleCatMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      playCatMeow("happy");
    }
  };

  const handleSpeechBubbleClick = () => {
    playCatPop();
    const quotes = SPEECH_BUBBLES[mood];
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const remainingPets = Math.max(0, 3 - (catState.petCount ?? 0));
  const currentQuote = SPEECH_BUBBLES[mood][quoteIndex % SPEECH_BUBBLES[mood].length];

  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 grid place-items-center min-h-full animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 flex flex-col items-center font-sans text-slate-800 my-auto"
      >
        {/* Top Controls: Sound Mute & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={handleToggleSound}
            className="text-slate-500 hover:text-slate-800 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors text-base cursor-pointer"
            title={muted ? "Bật âm thanh meow" : "Tắt âm thanh meow"}
            aria-label="Toggle Sound"
          >
            {muted ? "🔇" : "🔊"}
          </button>

          <button
            onClick={() => {
              playCatPop();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Header Badges */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-900 shadow-sm">
            <span>🐾 Mèo Mochi</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-bold">{MOOD_NAMES[mood]}</span>
          </div>
          <div className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            Điểm tích lũy: <span className="font-extrabold text-amber-600">{pointsBalance} pts</span>
          </div>
        </div>

        {/* Interactive Speech Bubble */}
        <button
          onClick={handleSpeechBubbleClick}
          className="relative bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-bl-none shadow-lg max-w-[90%] text-center my-2 border border-slate-700 transition-transform active:scale-95 cursor-pointer group"
          title="Bấm để Mochi trò chuyện nè anh!"
        >
          <span>{currentQuote}</span>
          <div className="absolute -bottom-2 left-4 w-3 h-3 bg-slate-900 group-hover:bg-slate-800 transform rotate-45 border-r border-b border-slate-700" />
        </button>

        {/* Interactive Stage Arena */}
        <div className="my-2 p-4 sm:p-5 bg-gradient-to-b from-amber-50/60 via-orange-50/40 to-amber-100/50 rounded-3xl w-full flex flex-col justify-center items-center border border-amber-200/80 shadow-inner relative overflow-hidden group">
          {/* Background Room Details */}
          <div className="absolute top-2 left-3 text-[10px] text-amber-800/40 font-medium tracking-wide">
            🏠 Phòng của Mochi
          </div>

          <div className="py-2">
            <CatSprite
              mood={mood}
              size={160}
              actionState={actionState}
              onActionComplete={() => setActionState(null)}
              interactive={true}
            />
          </div>

          {/* Interactive Hint */}
          <div className="mt-1 text-[11px] font-semibold text-amber-800/70 bg-amber-200/50 px-3 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
            <span>👇</span>
            <span>Bấm hoặc rê chuột lên mèo để vuốt ve nha anh!</span>
          </div>
        </div>

        {/* Status Bars */}
        <div className="w-full space-y-2.5 my-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          {/* Happiness */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>❤️ Vui vẻ</span>
              <span className="text-pink-600">{catState.happiness}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500 rounded-full shadow"
                style={{ width: `${catState.happiness}%` }}
              />
            </div>
          </div>

          {/* Hunger */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>🍗 Cơn đói (thấp là no)</span>
              <span className="text-amber-600">{catState.hunger}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 rounded-full shadow"
                style={{ width: `${catState.hunger}%` }}
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>🧼 Sạch sẽ</span>
              <span className="text-sky-600">{catState.cleanliness}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500 rounded-full shadow"
                style={{ width: `${catState.cleanliness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback / Error Toast */}
        {feedbackMsg && (
          <div className="w-full text-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 py-2 px-3 rounded-xl mb-2 animate-in fade-in flex items-center justify-center gap-1.5">
            <span>✅</span> <span>{feedbackMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="w-full text-center text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300 py-2 px-3 rounded-xl mb-2 animate-in fade-in flex items-center justify-center gap-1.5">
            <span>⚠️</span> <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Feed */}
          <button
            onClick={() => handleAction("feed", "feed")}
            disabled={loadingAction !== null || pointsBalance < 5}
            className="flex flex-col items-center justify-center p-2.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200/90 rounded-2xl transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">🍲</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">Cho ăn</span>
            <span className="text-[10px] text-amber-700 font-semibold">-5 pts</span>
          </button>

          {/* Bath */}
          <button
            onClick={() => handleAction("bath", "bath")}
            disabled={loadingAction !== null || pointsBalance < 10}
            className="flex flex-col items-center justify-center p-2.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed border border-sky-200/90 rounded-2xl transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">🧼</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">Tắm rửa</span>
            <span className="text-[10px] text-sky-700 font-semibold">-10 pts</span>
          </button>

          {/* Pet */}
          <button
            onClick={() => handleAction("pet", "pet")}
            disabled={loadingAction !== null || remainingPets <= 0}
            className="flex flex-col items-center justify-center p-2.5 bg-pink-50 hover:bg-pink-100 disabled:opacity-50 disabled:cursor-not-allowed border border-pink-200/90 rounded-2xl transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">👋</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">Vuốt ve</span>
            <span className="text-[10px] text-pink-700 font-semibold">
              Miễn phí ({remainingPets}/3)
            </span>
          </button>

          {/* Play */}
          <button
            onClick={() => handleAction("play", "play")}
            disabled={loadingAction !== null || pointsBalance < 15}
            className="flex flex-col items-center justify-center p-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200/90 rounded-2xl transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="text-2xl">🧶</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5">Chơi đùa</span>
            <span className="text-[10px] text-indigo-700 font-semibold">-15 pts</span>
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalJSX, document.body) : null;
}
