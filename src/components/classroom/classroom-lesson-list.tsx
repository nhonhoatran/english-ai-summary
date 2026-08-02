"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  selectClassroomLessonAction,
  removeClassroomLessonAction,
} from "@/app/actions/classroom-lesson-actions";
import { ClassroomAddLessonDialog } from "@/components/classroom/classroom-add-lesson-dialog";
import {
  BookOpen,
  Play,
  Trash2,
  Loader2,
  CircleDot,
  AlertCircle,
} from "lucide-react";

export interface ClassroomLessonSummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  durationSec: number | null;
}

interface ClassroomLessonListProps {
  code: string;
  lessons: ClassroomLessonSummary[];
  currentLessonId: string | null;
  isHost: boolean;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  return `${mins} phút`;
}

export function ClassroomLessonList({
  code,
  lessons,
  currentLessonId,
  isHost,
}: ClassroomLessonListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (lessonId: string) => {
    if (!isHost || lessonId === currentLessonId) return;
    setError(null);
    setBusyId(lessonId);
    startTransition(async () => {
      const res = await selectClassroomLessonAction(code, lessonId);
      setBusyId(null);
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  };

  const handleRemove = (lessonId: string) => {
    setError(null);
    setBusyId(lessonId);
    startTransition(async () => {
      const res = await removeClassroomLessonAction(code, lessonId);
      setBusyId(null);
      setConfirmingId(null);
      if (!res.success) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-zinc-800/80 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Bài học trong lớp ({lessons.length})</span>
        </div>
        {isHost && (
          <ClassroomAddLessonDialog code={code} lessonCount={lessons.length} />
        )}
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {lessons.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Lớp chưa có bài học nào.
        </p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;
            const isBusy = isPending && busyId === lesson.id;
            const duration = formatDuration(lesson.durationSec);

            return (
              <li
                key={lesson.id}
                className={`rounded-xl border px-3 py-2.5 transition-all ${
                  isCurrent
                    ? "border-emerald-500/40 bg-emerald-950/30"
                    : "border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold text-zinc-100 leading-snug line-clamp-2">
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CircleDot className="w-3 h-3 animate-pulse" />
                          Đang học
                        </span>
                      )}
                      {lesson.status !== "READY" && (
                        <span className="text-amber-400 font-semibold">
                          {lesson.status === "FAILED" ? "Lỗi tạo bài" : "Đang tạo..."}
                        </span>
                      )}
                      {duration && <span>{duration}</span>}
                    </div>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!isCurrent && lesson.status === "READY" && (
                        <button
                          type="button"
                          onClick={() => handleSelect(lesson.id)}
                          disabled={isBusy}
                          title="Cho cả lớp học bài này"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors disabled:opacity-40"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {confirmingId === lesson.id ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(lesson.id)}
                          disabled={isBusy}
                          title="Bấm lần nữa để xóa"
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors disabled:opacity-40"
                        >
                          {isBusy ? "..." : "Xóa?"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(lesson.id)}
                          title="Xóa bài học khỏi lớp"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
