// path/to/src/app/lessons/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { IngestStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { LessonPlayerProvider } from "@/components/lesson/lesson-player-provider";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { TabScript } from "@/components/lesson/tab-script";
import { TabGrammar } from "@/components/lesson/tab-grammar";
import { TabQuiz } from "@/components/lesson/tab-quiz";
import { TabVocabulary } from "@/components/lesson/tab-vocabulary";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      segments: { orderBy: { orderIndex: "asc" } },
      grammarPoints: { orderBy: { orderIndex: "asc" } },
      quizQuestions: { orderBy: { orderIndex: "asc" } },
      vocabItems: {
        orderBy: { orderIndex: "asc" },
        include: { flashcard: true },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all lessons
        </Link>

        {/* Lesson Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-sm sm:text-base text-zinc-400">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Status Panel if NOT READY */}
        {lesson.status !== IngestStatus.READY ? (
          <StatusPanel
            status={lesson.status}
            errorMessage={lesson.errorMessage}
          />
        ) : (
          /* Main Interactive Player & 4 Tabs */
          <LessonPlayerProvider videoId={lesson.videoId}>
            <LessonTabs
              scriptTab={<TabScript segments={lesson.segments} />}
              grammarTab={
                <TabGrammar
                  grammarTheme={lesson.grammarTheme}
                  grammarPoints={lesson.grammarPoints}
                />
              }
              quizTab={<TabQuiz questions={lesson.quizQuestions} />}
              vocabTab={<TabVocabulary items={lesson.vocabItems} />}
            />
          </LessonPlayerProvider>
        )}
      </div>
    </div>
  );
}

function StatusPanel({
  status,
  errorMessage,
}: {
  status: IngestStatus;
  errorMessage: string | null;
}) {
  if (status === IngestStatus.FAILED) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          Lesson Ingestion Failed
        </div>
        <p className="text-sm text-rose-200/80">
          {errorMessage ||
            "An unknown error occurred while processing this video."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
      <div className="space-y-1">
        <h3 className="font-semibold text-lg text-white">Lesson is generating</h3>
        <p className="text-sm text-zinc-400">
          We are processing YouTube captions and extracting ELLLO format materials.
          Please refresh in a moment.
        </p>
      </div>
    </div>
  );
}
