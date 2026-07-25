// src/components/review/review-session.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Rating } from "ts-fsrs";
import { ReviewCard, ReviewCardItem } from "./review-card";
import { GradeButtons } from "./grade-buttons";
import { gradeFlashcardAction } from "@/app/actions/grade-flashcard-action";
import { CheckCircle2, Home } from "lucide-react";
import Link from "next/link";

interface ReviewSessionProps {
  initialCards: ReviewCardItem[];
}

export function ReviewSession({ initialCards }: ReviewSessionProps) {
  const [cards] = useState<ReviewCardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const currentCard = cards[currentIndex];
  const totalCount = cards.length;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.code === "Space" && !isRevealed && currentCard) {
        e.preventDefault();
        setIsRevealed(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, currentCard]);

  const handleGrade = (grade: Rating) => {
    if (!currentCard || isPending) return;

    startTransition(async () => {
      const res = await gradeFlashcardAction(currentCard.id, grade);
      if (!res.success) {
        console.error("Failed to grade flashcard:", res.error);
      }
      setIsRevealed(false);
      setCurrentIndex((prev) => prev + 1);
    });
  };

  if (!currentCard || currentIndex >= totalCount) {
    return (
      <div className="w-full max-w-lg mx-auto bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Review Completed!</h2>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Great job! You have reviewed all flashcards due for now.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-all border border-zinc-700/60"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-2">
        <span>
          Card {currentIndex + 1} of {totalCount}
        </span>
        <div className="w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard Component */}
      <ReviewCard
        card={currentCard}
        isRevealed={isRevealed}
        onReveal={() => setIsRevealed(true)}
      />

      {/* Grade Buttons (shown when revealed) */}
      {isRevealed && (
        <div className="animate-in fade-in duration-200">
          <GradeButtons onGrade={handleGrade} disabled={isPending} />
        </div>
      )}
    </div>
  );
}
