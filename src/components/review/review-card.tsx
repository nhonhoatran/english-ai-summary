// src/components/review/review-card.tsx
"use client";

import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";

export interface ReviewCardItem {
  id: string;
  vocabItem: {
    term: string;
    meaning: string;
    example: string;
    lesson: {
      id: string;
      title: string;
    };
  };
}

interface ReviewCardProps {
  card: ReviewCardItem;
  isRevealed: boolean;
  onReveal: () => void;
}

export function ReviewCard({ card, isRevealed, onReveal }: ReviewCardProps) {
  const { vocabItem } = card;

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[300px] shadow-2xl transition-all">
      {/* Front: Word */}
      <div className="w-full text-center space-y-3 my-auto">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
          Vocabulary Flashcard
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {vocabItem.term}
        </h2>

        {/* Revealed details */}
        {isRevealed ? (
          <div className="pt-6 border-t border-zinc-800/80 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Meaning
              </h3>
              <p className="text-lg text-zinc-100 font-medium">
                {vocabItem.meaning}
              </p>
            </div>

            {vocabItem.example && (
              <div className="space-y-1 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/50 text-left">
                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Example
                </h4>
                <p className="text-sm text-zinc-300 italic">
                  &ldquo;{vocabItem.example}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Link
                href={`/lessons/${vocabItem.lesson.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors"
              >
                Context: {vocabItem.lesson.title}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-8">
            <button
              type="button"
              onClick={onReveal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-sm font-semibold text-white transition-all border border-zinc-700/60 shadow-md cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Show Answer (Space)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
