// src/app/review/page.tsx
import { db } from "@/lib/db";
import { ReviewSession } from "@/components/review/review-session";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const session = await requireAuth();

  const dueCards = await db.flashcard.findMany({
    where: {
      userId: session.userId,
      due: { lte: new Date() },
    },
    orderBy: { due: "asc" },
    include: {
      vocabItem: {
        include: {
          lesson: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            FSRS Spaced Repetition
          </div>
        </div>

        {dueCards.length === 0 ? (
          <div className="max-w-lg mx-auto bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
            <div className="text-3xl">🎉</div>
            <h2 className="text-xl font-bold text-white">No cards due for review</h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              All your saved flashcards are up to date! Check back later when your next reviews are scheduled.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm border border-zinc-700"
              >
                Back to Lessons
              </Link>
            </div>
          </div>
        ) : (
          <ReviewSession initialCards={dueCards} />
        )}
      </div>
    </div>
  );
}
