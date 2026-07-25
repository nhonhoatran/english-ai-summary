// path/to/src/app/page.tsx
import { db } from "@/lib/db";
import { AddLessonForm } from "@/components/add-lesson-form";
import { LessonListCard } from "@/components/lesson/lesson-list-card";

export default async function Home() {
  const lessons = await db.lesson.findMany({
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
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-8">
      <main className="w-full max-w-4xl space-y-10">
        <div className="text-center space-y-3 pt-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            YouTube English Lesson Generator
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Paste any YouTube English video URL to generate an interactive ELLLO-style lesson with script, grammar, quiz, and vocabulary.
          </p>
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
