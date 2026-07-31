// path/to/src/app/lessons/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { IngestStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { LessonPlayerProvider } from "@/components/lesson/lesson-player-provider";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { TabSummary } from "@/components/lesson/tab-summary";
import { TabScript } from "@/components/lesson/tab-script";
import { TabDialogue } from "@/components/lesson/tab-dialogue";
import { TabGrammar } from "@/components/lesson/tab-grammar";
import { TabQuiz } from "@/components/lesson/tab-quiz";
import { TabVocabulary } from "@/components/lesson/tab-vocabulary";
import { TabWritingPractice } from "@/components/lesson/tab-writing-practice";
import { requireAuth } from "@/lib/auth/require-auth";
import { DeleteLessonButton } from "@/components/lesson/delete-lesson-button";
import { PointsWidget } from "@/components/points/points-widget";
import { LessonTimeTracker } from "@/components/points/lesson-time-tracker";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const session = await requireAuth();

  const lesson = await db.lesson.findFirst({
    where: { id, userId: session.userId },
    include: {
      segments: { orderBy: { orderIndex: "asc" } },
      dialogueLines: { orderBy: { orderIndex: "asc" } },
      grammarPoints: { orderBy: { orderIndex: "asc" } },
      quizQuestions: { orderBy: { orderIndex: "asc" } },
      writingPrompts: { orderBy: { orderIndex: "asc" } },
      vocabItems: {
        orderBy: { orderIndex: "asc" },
        include: {
          flashcards: {
            where: { userId: session.userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const vocabItemsForTab = lesson.vocabItems.map((item) => ({
    id: item.id,
    orderIndex: item.orderIndex,
    term: item.term,
    ipa: item.ipa,
    meaning: item.meaning,
    example: item.example,
    flashcard: item.flashcards[0] ? { id: item.flashcards[0].id } : null,
  }));

  const writingPromptsForTab = lesson.writingPrompts.map((wp) => ({
    id: wp.id,
    orderIndex: wp.orderIndex,
    viMeaning: wp.viMeaning,
  }));

  const isChinese = lesson.targetLanguage === "chinese";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 relative overflow-hidden">
      {/* Time tracker to award daily_lesson points after 30s */}
      <LessonTimeTracker lessonId={lesson.id} />

      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[450px] h-[250px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back navigation & Actions Header */}
        <div className="flex items-center justify-between glass-card px-4 py-3 shadow-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            Back to lessons
          </Link>
          <div className="flex items-center gap-3">
            <PointsWidget />
            <DeleteLessonButton
              lessonId={lesson.id}
              redirectOnSuccess={true}
              variant="button"
            />
          </div>
        </div>

        {/* Lesson Header Card */}
        <div className="p-6 glass-card space-y-3 border-zinc-800/80 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800/90 text-zinc-200 border border-zinc-700/80">
              {isChinese ? "🇨🇳 Chinese" : "🇺🇸 English"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
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
          /* Main Interactive Player & 7 Tabs */
          <LessonPlayerProvider videoId={lesson.videoId}>
            <LessonTabs
              summaryTab={
                <TabSummary
                  summary={lesson.summary ?? ""}
                  title={lesson.title}
                  description={lesson.description}
                />
              }
              scriptTab={<TabScript segments={lesson.segments} />}
              dialogueTab={
                <TabDialogue
                  dialogueLines={lesson.dialogueLines}
                  segments={lesson.segments}
                />
              }
              grammarTab={
                <TabGrammar
                  grammarTheme={lesson.grammarTheme}
                  grammarPoints={lesson.grammarPoints}
                />
              }
              quizTab={<TabQuiz questions={lesson.quizQuestions} />}
              vocabTab={
                <TabVocabulary
                  items={vocabItemsForTab}
                  targetLanguage={lesson.targetLanguage}
                />
              }
              writingTab={
                <TabWritingPractice
                  prompts={writingPromptsForTab}
                  lessonId={lesson.id}
                  targetLanguage={lesson.targetLanguage}
                />
              }
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
