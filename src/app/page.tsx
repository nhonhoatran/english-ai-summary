// path/to/src/app/page.tsx
import { db } from "@/lib/db";
import { AddLessonForm } from "@/components/add-lesson-form";
import { LessonListCard } from "@/components/lesson/lesson-list-card";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default async function Home() {
  const [lessons, dueCount] = await Promise.all([
    db.lesson.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        videoId: true,
        title: true,
        description: true,
        durationSec: true,
        status: true,
        createdAt: true,
      },
    }),
    db.flashcard.count({
      where: { due: { lte: new Date() } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-8">
      <main className="w-full max-w-4xl space-y-10">
        <div className="flex flex-col items-center text-center space-y-3 pt-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              YouTube English Lesson Generator
            </h1>
          </div>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Paste any YouTube English video URL to generate an interactive ELLLO-style lesson with script, grammar, quiz, and vocabulary.
          </p>

          <div className="pt-2">
            <Link
              href="/review"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Review Flashcards</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                {dueCount}
              </span>
            </Link>
          </div>
        </div>

        <AddLessonForm />

        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center justify-between">
            <span>Lessons</span>
            <span className="text-xs font-normal text-zinc-500">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          </h2>

          {lessons.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-sm">
              No lessons generated yet. Paste a YouTube URL above to create your first lesson!
            </div>
          ) : (
            <div className="grid gap-3">
              {lessons.map((lesson) => (
                <LessonListCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
