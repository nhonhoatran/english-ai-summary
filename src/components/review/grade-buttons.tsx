// src/components/review/grade-buttons.tsx
"use client";

import { useEffect } from "react";
import { Rating } from "ts-fsrs";

interface GradeButtonsProps {
  onGrade: (grade: Rating) => void;
  disabled?: boolean;
}

export function GradeButtons({ onGrade, disabled }: GradeButtonsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "1") onGrade(Rating.Again);
      if (e.key === "2") onGrade(Rating.Hard);
      if (e.key === "3") onGrade(Rating.Good);
      if (e.key === "4") onGrade(Rating.Easy);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGrade, disabled]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mx-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onGrade(Rating.Again)}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 active:scale-95 text-rose-300 font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        <span className="text-base font-bold">Again</span>
        <span className="text-[10px] text-rose-400/70 font-mono">(1)</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onGrade(Rating.Hard)}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/60 active:scale-95 text-amber-300 font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        <span className="text-base font-bold">Hard</span>
        <span className="text-[10px] text-amber-400/70 font-mono">(2)</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onGrade(Rating.Good)}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 hover:bg-blue-900/60 active:scale-95 text-blue-300 font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        <span className="text-base font-bold">Good</span>
        <span className="text-[10px] text-blue-400/70 font-mono">(3)</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onGrade(Rating.Easy)}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/60 active:scale-95 text-emerald-300 font-medium transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        <span className="text-base font-bold">Easy</span>
        <span className="text-[10px] text-emerald-400/70 font-mono">(4)</span>
      </button>
    </div>
  );
}
