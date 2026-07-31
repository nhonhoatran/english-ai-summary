// path/to/src/app/page.tsx
import { db } from "@/lib/db";
import { AddLessonForm } from "@/components/add-lesson-form";
import { LessonListCard } from "@/components/lesson/lesson-list-card";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { Sparkles, Phone, BookOpen, BookMarked } from "lucide-react";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function Home() {
  const session = await requireAuth();

  const [lessons, dueCount, totalVocabCount] = await Promise.all([
    db.lesson.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        videoId: true,
        title: true,
        description: true,
        durationSec: true,
        targetLanguage: true,
        status: true,
        createdAt: true,
      },
    }),
    db.flashcard.count({
      where: {
        userId: session.userId,
        due: { lte: new Date() },
      },
    }),
    db.vocabItem.count({
      where: {
        lesson: { userId: session.userId },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambient Glow Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[20%] w-[450px] h-[280px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-4xl space-y-10 animate-fade-in">
        {/* Top Header / Account Info */}
        <div className="flex justify-between items-center w-full glass-card px-5 py-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span>SĐT: <strong className="text-white font-semibold">{session.phone}</strong></span>
          </div>
          <LogoutButton />
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>AI-Powered Multilingual Video Lessons</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight gradient-text max-w-2xl leading-tight sm:leading-tight">
            Learn from videos.<br />Never forget a word.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Paste any YouTube video URL in English or Chinese. Get interactive ELLLO-style lessons with script, grammar, vocabulary, quiz, and writing practice instantly.
          </p>

          {/* Stat Pills / Review Shortcut */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/review"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Review Flashcards</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full">
                {dueCount}
              </span>
            </Link>

            <div className="inline-flex items-center gap-4 px-4 py-2.5 rounded-xl glass-card text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <strong className="text-white">{lessons.length}</strong> Lessons
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-white">{totalVocabCount}</strong> Vocab Terms
              </span>
            </div>
          </div>
        </div>

        {/* Ingest Form Card */}
        <div className="glass-card p-6 shadow-2xl border-zinc-800/80">
          <AddLessonForm />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-blue-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">AI Summary & Transcript</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              3-sentence summary, level recommendation, and dual-speaker script timestamp sync.
            </p>
          </div>

          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-purple-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">Vocabulary & IPA / Pinyin</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automatic phonetic transcription (IPA for EN, Pinyin for ZH) and 1-click FSRS flashcard deck.
            </p>
          </div>

          <div className="glass-card p-4 space-y-2 border-zinc-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">Writing Practice & Quiz</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Translate sentences with instant AI feedback and test your comprehension with interactive quizzes.
            </p>
          </div>
        </div>

        {/* Lesson List Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <span>Your Lessons</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
                {lessons.length}
              </span>
            </h2>
          </div>

          {lessons.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 glass-card text-sm space-y-2">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 font-medium">No lessons generated yet.</p>
              <p className="text-xs text-zinc-500">Paste a YouTube URL above to create your first lesson!</p>
            </div>
          ) : (
            <div className="grid gap-3.5">
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
